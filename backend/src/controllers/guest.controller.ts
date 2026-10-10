import type { Request, Response } from 'express';
import type { HydratedDocument } from 'mongoose';
import type { IOrder } from '../models/Order';
import { Purchase } from '../models/Purchase';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { buildAccessPayload, isAccessActive, requireActivePurchase } from '../services/access.service';
import { streamProductFile } from '../services/file.service';
import { canClaimAccount, loadOrderWithToken } from '../services/orderAccess.service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/helpers';
import { Order } from '../models/Order';
import { env } from '../config/env';
import { sendRecoveryEmail } from '../services/email.service';
import { decrypt } from '../utils/helpers';
import { publicUser, setAuthCookie } from './auth.controller';

const tokenOf = (req: Request) => String(req.query.token ?? '');

/**
 * The purchase this token may use. Paid orders: any active purchase of the product by the buyer.
 * Unpaid (in review) orders: only the provisional purchase created for THIS order.
 */
async function purchaseFor(order: HydratedDocument<IOrder>) {
  if (order.paymentStatus === 'PAID') return requireActivePurchase(order.user, String(order.product));
  const p = await Purchase.findOne({ order: order._id });
  if (!p) return null;
  if (!isAccessActive(p)) throw new AppError(403, p.accessStatus === 'REVOKED' ? 'Product access has been revoked.' : 'Your access has expired.', 'ACCESS_DENIED');
  return p;
}

/** Token-protected access for buyers who did not log in. */
export const guestAccess = asyncHandler(async (req: Request, res: Response) => {
  const order = await loadOrderWithToken(req.params.orderNumber, tokenOf(req));
  const summary = { orderNumber: order.orderNumber, productId: String(order.product), productTitle: order.productTitleSnapshot, amount: order.amount, paymentStatus: order.paymentStatus };
  const purchase = await purchaseFor(order);
  if (!purchase) return ok(res, { order: summary, access: null, canSetPassword: false, rejectReason: (order.metadata?.rejectReason as string | undefined) ?? null });
  const [product, user] = await Promise.all([Product.findById(order.product), User.findById(order.user)]);
  if (!product) throw new AppError(404, 'Product not found', 'NOT_FOUND');
  purchase.lastAccessedAt = new Date();
  await purchase.save();
  ok(res, { order: summary, access: buildAccessPayload(product, purchase), canSetPassword: await canClaimAccount(order, user), rejectReason: null });
});

export const guestFile = asyncHandler(async (req: Request, res: Response) => {
  const order = await loadOrderWithToken(req.params.orderNumber, tokenOf(req));
  const purchase = await purchaseFor(order);
  if (!purchase) throw new AppError(403, 'Access has not been granted for this order yet', 'NOT_PAID');
  const product = await Product.findById(order.product);
  if (!product) throw new AppError(404, 'Product not found', 'NOT_FOUND');
  await streamProductFile(res, purchase, product, req.query.disposition === 'inline', `guest:${order.orderNumber}`);
});

/** Lets a guest turn their auto-created account into a normal one so they can log in later. */
export const setPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body as { token: string; password: string };
  const order = await loadOrderWithToken(req.params.orderNumber, token);
  const user = await User.findById(order.user).select('+password');
  if (!user || !(await canClaimAccount(order, user))) throw new AppError(409, 'A password cannot be set from this link. Please log in instead.', 'CANNOT_CLAIM');
  user.password = password;
  user.isGuest = false;
  user.tokenVersion += 1;
  await user.save();
  setAuthCookie(res, user);
  ok(res, publicUser(user), 200, 'Password set');
});

const recentRecovery = new Map<string, number>();

/** Emails the buyer their private links. Same response whether or not orders exist; links only ever go to the email on the order. */
export const recoverAccess = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  const last = recentRecovery.get(email) ?? 0;
  if (Date.now() - last > 2 * 60 * 1000) {
    recentRecovery.set(email, Date.now());
    if (recentRecovery.size > 5000) recentRecovery.clear();
    const orders = await Order.find({ customerEmail: email, paymentStatus: { $in: ['PAID', 'PROCESSING'] } }).sort({ createdAt: -1 }).limit(10).select('+accessTokenEnc');
    const items = orders.filter((o) => o.accessTokenEnc).map((o) => ({ title: o.productTitleSnapshot, orderNumber: o.orderNumber, link: `${env.primaryFrontend}/order/${o.orderNumber}?token=${decrypt(o.accessTokenEnc!)}` }));
    if (items.length) void sendRecoveryEmail(email, items);
  }
  ok(res, null, 200, 'If we found purchases for that email, the links are on their way.');
});
