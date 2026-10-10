import crypto from 'crypto';
import type { HydratedDocument } from 'mongoose';
import { Order, type IOrder } from '../models/Order';
import type { IUser } from '../models/User';
import { AppError } from '../utils/AppError';
import { decrypt, encrypt } from '../utils/helpers';

export const newAccessToken = () => crypto.randomBytes(24).toString('hex');
export const sealToken = (token: string) => encrypt(token);

/** Constant-time comparison of a presented token with the one stored (encrypted) on the order. */
export function tokenMatches(order: Pick<IOrder, 'accessTokenEnc'>, token: unknown): boolean {
  if (typeof token !== 'string' || token.length < 10 || token.length > 100 || !order.accessTokenEnc) return false;
  const stored = Buffer.from(decrypt(order.accessTokenEnc));
  const given = Buffer.from(token);
  return stored.length > 0 && stored.length === given.length && crypto.timingSafeEqual(stored, given);
}

/** Same error for "no such order" and "wrong token" so order numbers cannot be probed. */
export async function loadOrderWithToken(orderNumber: string, token: unknown): Promise<HydratedDocument<IOrder>> {
  const order = await Order.findOne({ orderNumber }).select('+accessTokenEnc');
  if (!order || !tokenMatches(order, token)) throw new AppError(403, 'This access link is invalid', 'INVALID_TOKEN');
  return order;
}

/**
 * A guest may set a password only on the account created by THEIR order (that user's first order).
 * This stops someone from paying for a cheap product with a victim's email and taking over the victim's account.
 */
export async function canClaimAccount(order: HydratedDocument<IOrder>, user: HydratedDocument<IUser> | null) {
  if (!user?.isGuest || !['PAID', 'PROCESSING'].includes(order.paymentStatus)) return false;
  const first = await Order.findOne({ user: user._id }).sort({ createdAt: 1 }).select('_id');
  return Boolean(first) && String(first!._id) === String(order._id);
}
