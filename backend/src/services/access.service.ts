import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';
import { Order, type IOrder } from '../models/Order';
import { Product, type IProduct } from '../models/Product';
import { Purchase, type IPurchase } from '../models/Purchase';
import { AppError } from '../utils/AppError';
import { decrypt } from '../utils/helpers';
import { logger } from '../utils/logger';

const DAY = 86_400_000;

export const isAccessActive = (p: Pick<IPurchase, 'accessStatus' | 'expiresAt'>) =>
  p.accessStatus === 'ACTIVE' && (!p.expiresAt || p.expiresAt.getTime() > Date.now());

export const effectiveStatus = (p: Pick<IPurchase, 'accessStatus' | 'expiresAt'>): IPurchase['accessStatus'] =>
  p.accessStatus === 'ACTIVE' && p.expiresAt && p.expiresAt.getTime() <= Date.now() ? 'EXPIRED' : p.accessStatus;

/** Idempotent: safe to call any number of times for the same order. */
export async function grantAccess(order: HydratedDocument<IOrder>) {
  const existing = await Purchase.findOne({ order: order._id });
  if (existing) return existing;

  const product = await Product.findById(order.product);
  if (!product) throw new AppError(404, 'Product no longer exists', 'NOT_FOUND');
  const now = new Date();
  const addMs = product.duration > 0 ? product.duration * DAY : 0;

  if (!product.allowMultiplePurchases) {
    const active = await Purchase.findOne({ user: order.user, product: order.product, accessStatus: 'ACTIVE' });
    if (active) {
      if (addMs && active.expiresAt) {
        active.expiresAt = new Date(Math.max(active.expiresAt.getTime(), now.getTime()) + addMs);
        await active.save();
      }
      return active;
    }
  }

  try {
    const purchase = await Purchase.create({
      user: order.user, product: order.product, order: order._id,
      accessStatus: 'ACTIVE', accessGrantedAt: now,
      expiresAt: addMs ? new Date(now.getTime() + addMs) : null,
    });
    logger.info({ orderNumber: order.orderNumber, purchaseId: String(purchase._id) }, 'Access granted');
    return purchase;
  } catch (e) {
    if ((e as { code?: number }).code === 11000) {
      const dup = await Purchase.findOne({ order: order._id });
      if (dup) return dup;
    }
    throw e;
  }
}

export async function findActivePurchase(userId: Types.ObjectId | string, productId: Types.ObjectId | string) {
  const purchases = await Purchase.find({ user: userId, product: productId }).sort({ createdAt: -1 });
  const active = purchases.find(isAccessActive);
  return { active, purchases };
}

/** Throws 403 unless the user holds an active purchase for the product. */
export async function requireActivePurchase(userId: Types.ObjectId | string, productId: string) {
  if (!Types.ObjectId.isValid(productId)) throw new AppError(400, 'Invalid product', 'BAD_REQUEST');
  const { active, purchases } = await findActivePurchase(userId, productId);
  if (active) return active;
  const stale = purchases.filter((p) => p.accessStatus === 'ACTIVE');
  if (stale.length) await Purchase.updateMany({ _id: { $in: stale.map((p) => p._id) } }, { accessStatus: 'EXPIRED' });
  if (purchases.some((p) => p.accessStatus === 'REVOKED')) throw new AppError(403, 'Product access has been revoked.', 'ACCESS_REVOKED');
  if (purchases.length) throw new AppError(403, 'Your access to this product has expired.', 'ACCESS_EXPIRED');
  throw new AppError(403, 'You do not have access to this product.', 'ACCESS_DENIED');
}

export async function hasOrderAccess(orderId: Types.ObjectId) {
  const o = await Order.findById(orderId);
  return o?.paymentStatus === 'PAID';
}

/** Everything a verified buyer may see for a product (never sent to non-buyers). */
export function buildAccessPayload(p: HydratedDocument<IProduct>, purchase: HydratedDocument<IPurchase>) {
  const creds = p.appCredentials;
  return {
    id: String(p._id), title: p.title, productType: p.productType, accessType: p.accessType,
    content: p.content, externalUrl: p.externalUrl, appInstructions: p.appInstructions,
    hasFile: Boolean(p.pdfPublicId || p.pdfUrl), fileName: p.fileName || 'document.pdf',
    downloadsRemaining: p.downloadLimit > 0 ? Math.max(0, p.downloadLimit - purchase.downloadCount) : null,
    downloadCount: purchase.downloadCount, expiresAt: purchase.expiresAt,
    credentials: p.productType === 'PREMIUM_APP' || creds?.loginEmail
      ? { loginEmail: creds.loginEmail, password: decrypt(creds.passwordEnc), loginUrl: creds.loginUrl, notes: creds.notes, expiresAt: creds.expiresAt }
      : null,
    isCourse: p.courseModules.length > 0,
  };
}
