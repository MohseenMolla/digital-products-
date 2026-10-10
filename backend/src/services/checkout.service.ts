import crypto from 'crypto';
import type { HydratedDocument } from 'mongoose';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { User, type IUser } from '../models/User';
import { AppError } from '../utils/AppError';
import { generateOrderNumber } from '../utils/helpers';
import { logger } from '../utils/logger';
import { findActivePurchase } from './access.service';
import { notifyAdmins } from './notification.service';
import { newAccessToken, sealToken } from './orderAccess.service';
import { finalizeFreeOrder } from './payment.service';
import { applyCoupon, round2 } from './pricing.service';

interface CheckoutInput { productId: string; fullName: string; email: string; phone: string; couponCode?: string; }

/**
 * Logged-in users buy as themselves. Guests are matched by email to an existing account, or a
 * passwordless guest account is created so the purchase has an owner. The guest can set a password later.
 */
async function resolveCustomer(authUser: HydratedDocument<IUser> | null, input: CheckoutInput): Promise<HydratedDocument<IUser>> {
  if (authUser) return authUser;
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    if (!existing.isActive) throw new AppError(403, 'This account has been disabled', 'ACCOUNT_DISABLED');
    return existing;
  }
  try {
    return await User.create({ name: input.fullName, email: input.email, phone: input.phone, password: crypto.randomBytes(24).toString('hex'), role: 'USER', isGuest: true });
  } catch (e) {
    if ((e as { code?: number }).code === 11000) { const u = await User.findOne({ email: input.email }); if (u) return u; }
    throw e;
  }
}

export async function createCheckout(authUser: HydratedDocument<IUser> | null, input: CheckoutInput) {
  // Price ALWAYS comes from the database; the client only supplies the product id.
  const product = await Product.findOne({ _id: input.productId, status: 'PUBLISHED' });
  if (!product) throw new AppError(404, 'Product not found', 'NOT_FOUND');
  if (product.stockStatus === 'OUT_OF_STOCK') throw new AppError(409, 'This product is currently unavailable', 'OUT_OF_STOCK');

  const user = await resolveCustomer(authUser, input);
  if (!product.allowMultiplePurchases) {
    const { active } = await findActivePurchase(user._id, product._id);
    if (active) throw new AppError(409, 'You already own this product. Log in, or use the access link from your purchase email.', 'ALREADY_OWNED');
  }

  const subtotal = round2(product.price);
  let discount = 0;
  let couponCode: string | undefined;
  if (input.couponCode) {
    const r = await applyCoupon(input.couponCode, subtotal);
    discount = r.discount; couponCode = r.coupon.code;
  }
  const amount = round2(Math.max(subtotal - discount, 0));
  const token = newAccessToken();

  let order = null;
  for (let i = 0; i < 4 && !order; i++) {
    try {
      order = await Order.create({
        orderNumber: generateOrderNumber(), user: user._id,
        customerName: input.fullName, customerEmail: input.email, customerPhone: input.phone,
        product: product._id, productTitleSnapshot: product.title,
        subtotal, discount, couponCode, amount, currency: 'BDT', accessTokenEnc: sealToken(token),
        timeline: [{ event: 'CREATED', note: authUser ? 'Order created' : 'Guest order created', at: new Date() }],
      });
    } catch (e) { if ((e as { code?: number }).code !== 11000 || i === 3) throw e; }
  }
  if (!order) throw new AppError(500, 'Could not create order', 'INTERNAL_ERROR');
  logger.info({ orderNumber: order.orderNumber, amount, guest: !authUser }, 'Order created');
  void notifyAdmins({ type: 'NEW_ORDER', title: 'New order', message: `${order.orderNumber} - ${product.title}`, link: `/admin/orders/${order._id}` });

  if (amount <= 0) {
    await finalizeFreeOrder(order);
    return { free: true as const, orderNumber: order.orderNumber, accessToken: token };
  }

  return { free: false as const, orderNumber: order.orderNumber, accessToken: token };
}
