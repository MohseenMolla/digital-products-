import type { HydratedDocument } from 'mongoose';
import { env } from '../config/env';
import { Coupon } from '../models/Coupon';
import { Order, type IOrder } from '../models/Order';
import { PaymentTransaction } from '../models/PaymentTransaction';
import { Product } from '../models/Product';
import { Purchase } from '../models/Purchase';
import { SiteSetting } from '../models/SiteSetting';
import { AppError } from '../utils/AppError';
import { decrypt } from '../utils/helpers';
import { logger } from '../utils/logger';
import { grantAccess } from './access.service';
import { sendAccessEmail, sendPaymentEmail } from './email.service';
import { notifyAdmins, notifyUser } from './notification.service';
import { sendServerPurchaseTracking } from './tracking.service';

export type PayMethod = 'BKASH' | 'NAGAD' | 'ROCKET';

const SUBMITTABLE = ['PENDING', 'FAILED', 'CANCELLED'];
const OPEN_STATES = ['PENDING', 'PROCESSING', 'FAILED', 'CANCELLED'];
const tl = (event: string, note: string) => ({ event, note, at: new Date() });
const duplicate = (e: unknown) => (e as { code?: number })?.code === 11000;

/** Receiving numbers: Admin > Settings wins; BKASH_NUMBER / NAGAD_NUMBER / ROCKET_NUMBER in .env are the fallback. */
export async function getPaymentConfig() {
  const s = (await SiteSetting.findOne({ key: 'main' })) ?? (await SiteSetting.create({ key: 'main' }));
  const fallback: Record<PayMethod, string> = { BKASH: env.BKASH_NUMBER ?? '', NAGAD: env.NAGAD_NUMBER ?? '', ROCKET: env.ROCKET_NUMBER ?? '' };
  const base = s.payment.methods.length
    ? s.payment.methods.map((m) => ({ key: m.key, label: m.label, accountType: m.accountType, enabled: m.enabled, number: m.number }))
    : (['BKASH', 'NAGAD', 'ROCKET'] as PayMethod[]).map((key) => ({ key, label: key === 'BKASH' ? 'bKash' : key === 'NAGAD' ? 'Nagad' : 'Rocket', accountType: 'Send Money', enabled: true, number: '' }));
  return {
    instantAccess: s.payment.instantAccess,
    note: s.payment.note,
    methods: base.map((m) => ({ ...m, number: (m.number || '').trim() || fallback[m.key] || '' })),
  };
}

async function accessLink(order: HydratedDocument<IOrder>) {
  const full = await Order.findById(order._id).select('+accessTokenEnc');
  const token = full?.accessTokenEnc ? decrypt(full.accessTokenEnc) : '';
  return token ? `${env.primaryFrontend}/order/${order.orderNumber}?token=${token}` : `${env.primaryFrontend}/dashboard/products/${order.product}`;
}

async function afterPaid(order: HydratedDocument<IOrder>) {
  try {
    void sendServerPurchaseTracking(order);
    if (order.couponCode) await Coupon.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } });
    const product = await Product.findById(order.product).select('title');
    const title = product?.title ?? order.productTitleSnapshot;
    await Promise.all([
      notifyUser(order.user, { type: 'PAYMENT_SUCCESS', title: 'Payment confirmed', message: `${title} is confirmed`, link: `/dashboard/products/${order.product}` }),
      notifyAdmins({ type: 'PAYMENT_SUCCESS', title: 'Payment approved', message: `${order.orderNumber} - ৳${order.amount}`, link: `/admin/orders/${order._id}` }),
    ]);
    if (order.customerEmail && !order.customerEmail.includes('@customer.neuromark.shop')) {
      await sendPaymentEmail(order.customerEmail, { orderNumber: order.orderNumber, product: title, amount: order.amount, productId: String(order.product) });
      if (!order.metadata?.accessEmailSent) await sendAccessEmail(order.customerEmail, { product: title, link: await accessLink(order) });
    }
  } catch (e) { logger.warn({ err: (e as Error).message }, 'post-payment side effects failed'); }
}

/** Atomic move to PAID. Only ONE caller wins, so revenue/purchases/emails can never be duplicated. */
async function settle(order: HydratedDocument<IOrder>, info: { transactionId: string; method: string }, note: string, extra: Record<string, unknown> = {}) {
  let updated: HydratedDocument<IOrder> | null = null;
  try {
    updated = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: { $in: OPEN_STATES } },
      { $set: { paymentStatus: 'PAID', orderStatus: 'COMPLETED', transactionId: info.transactionId, paymentMethod: info.method, paidAt: new Date(), ...extra }, $push: { timeline: tl('PAID', note) } },
      { new: true },
    );
  } catch (e) {
    if (duplicate(e)) throw new AppError(409, 'This transaction ID is already used by another order', 'DUPLICATE_TRANSACTION');
    throw e;
  }
  if (!updated) throw new AppError(409, 'This order is already paid or cannot be approved', 'ALREADY_PAID');
  await Purchase.updateMany({ order: updated._id }, { accessStatus: 'ACTIVE', $unset: { revokedReason: '' } });
  await grantAccess(updated);
  logger.info({ orderNumber: updated.orderNumber, method: info.method }, 'Payment success');
  void afterPaid(updated);
  return updated;
}

/**
 * Buyer submits the transaction ID of their bKash/Nagad/Rocket Send Money.
 * - The same transaction ID can never be used twice (unique index + atomic order claim).
 * - Instant mode: access is granted now but the order stays "in review" (not revenue) until an admin approves it.
 */
export async function submitManualPayment(order: HydratedDocument<IOrder>, input: { method: PayMethod; transactionId: string; senderNumber: string }) {
  const cfg = await getPaymentConfig();
  const method = cfg.methods.find((m) => m.key === input.method && m.enabled && m.number);
  if (!method) throw new AppError(422, 'This payment method is not available', 'METHOD_UNAVAILABLE');
  if (!SUBMITTABLE.includes(order.paymentStatus)) throw new AppError(409, 'A payment has already been submitted for this order', 'ALREADY_SUBMITTED');

  try {
    await PaymentTransaction.create({
      order: order._id, transactionId: input.transactionId, paymentMethod: input.method, amount: order.amount, currency: order.currency,
      status: 'SUBMITTED', source: 'manual', gatewayResponse: { senderNumber: input.senderNumber, sentTo: method.number, accountType: method.accountType },
    });
  } catch (e) {
    if (duplicate(e)) throw new AppError(409, 'This transaction ID has already been used. Check the ID in your confirmation SMS.', 'DUPLICATE_TRANSACTION');
    throw e;
  }

  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: { $in: SUBMITTABLE } },
    { $set: { paymentStatus: 'PROCESSING', paymentMethod: input.method, transactionId: input.transactionId }, $push: { timeline: tl('PAYMENT_SUBMITTED', `${input.method} TrxID ${input.transactionId} from ${input.senderNumber}`) } },
    { new: true },
  ).catch(async (e) => { await PaymentTransaction.deleteOne({ transactionId: input.transactionId }); throw e; });
  if (!claimed) { await PaymentTransaction.deleteOne({ transactionId: input.transactionId }); throw new AppError(409, 'A payment has already been submitted for this order', 'ALREADY_SUBMITTED'); }

  logger.info({ orderNumber: claimed.orderNumber, method: input.method }, 'Payment submitted');
  void notifyAdmins({ type: 'PAYMENT_SUBMITTED', title: 'Payment awaiting verification', message: `${claimed.orderNumber} · ${input.method} · ${input.transactionId} · ৳${claimed.amount}`, link: `/admin/orders/${claimed._id}` });

  if (cfg.instantAccess) {
    await grantAccess(claimed);
    await Order.updateOne({ _id: claimed._id }, { $set: { 'metadata.accessEmailSent': true, 'metadata.provisionalAccess': true }, $push: { timeline: tl('INSTANT_ACCESS', 'Access granted pending admin verification') } });
    if (claimed.customerEmail && !claimed.customerEmail.includes('@customer.neuromark.shop')) {
      void accessLink(claimed).then((link) => sendAccessEmail(claimed.customerEmail, { product: claimed.productTitleSnapshot, link }));
    }
  }
  return { order: claimed, instant: cfg.instantAccess };
}

export async function approveOrder(order: HydratedDocument<IOrder>, admin: { id: string }, note: string) {
  const trx = order.transactionId ?? `MANUAL-${order.orderNumber}`;
  const method = order.paymentMethod ?? 'MANUAL';
  const updated = await settle(order, { transactionId: trx, method }, `Approved by admin${note ? `: ${note}` : ''}`, { 'metadata.approvedBy': admin.id, 'metadata.approveNote': note });
  await PaymentTransaction.findOneAndUpdate(
    { transactionId: trx },
    { $set: { status: 'APPROVED', verifiedAt: new Date() }, $setOnInsert: { order: order._id, amount: order.amount, currency: order.currency, paymentMethod: method, source: 'manual-approval' } },
    { upsert: true },
  );
  return updated;
}

export async function rejectOrder(order: HydratedDocument<IOrder>, reason: string) {
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: { $in: ['PENDING', 'PROCESSING'] } },
    { $set: { paymentStatus: 'FAILED', 'metadata.rejectReason': reason }, $push: { timeline: tl('REJECTED', reason) } },
    { new: true },
  );
  if (!updated) throw new AppError(409, 'Only unpaid or in-review orders can be rejected', 'INVALID_STATE');
  await PaymentTransaction.updateMany({ order: order._id, status: 'SUBMITTED' }, { status: 'REJECTED' });
  await Purchase.updateMany({ order: order._id }, { accessStatus: 'REVOKED', revokedReason: `Payment rejected: ${reason}` });
  await notifyUser(order.user, { type: 'PAYMENT_REJECTED', title: 'Payment could not be verified', message: `${order.orderNumber}: ${reason}`, link: `/payment/${order.orderNumber}` });
  logger.info({ orderNumber: order.orderNumber }, 'Payment rejected; access revoked');
  return updated;
}

/** Zero-amount orders (100% coupon) need no payment. */
export async function finalizeFreeOrder(order: HydratedDocument<IOrder>) {
  void sendServerPurchaseTracking(order);
  return settle(order, { transactionId: `FREE-${order.orderNumber}`, method: 'FREE' }, 'Free order');
}
