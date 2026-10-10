import type { Request, Response } from 'express';
import { Purchase } from '../models/Purchase';
import { loadOrderWithToken } from '../services/orderAccess.service';
import { getPaymentConfig, submitManualPayment, type PayMethod } from '../services/payment.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/helpers';

/** Everything the payment page needs. Guarded by the order's private token (no login required). */
export const getPayInfo = asyncHandler(async (req: Request, res: Response) => {
  const order = await loadOrderWithToken(req.params.orderNumber, req.query.token);
  const cfg = await getPaymentConfig();
  const hasAccess = Boolean(await Purchase.exists({ order: order._id, accessStatus: 'ACTIVE' })) || order.paymentStatus === 'PAID';
  ok(res, {
    order: {
      orderNumber: order.orderNumber, productTitle: order.productTitleSnapshot, subtotal: order.subtotal, discount: order.discount, amount: order.amount,
      paymentStatus: order.paymentStatus, customerPhone: order.customerPhone,
    },
    submitted: ['PROCESSING', 'PAID'].includes(order.paymentStatus) ? { method: order.paymentMethod, transactionId: order.transactionId } : null,
    rejectReason: order.paymentStatus === 'FAILED' ? (order.metadata?.rejectReason as string | undefined) ?? null : null,
    hasAccess, instantAccess: cfg.instantAccess, note: cfg.note,
    methods: cfg.methods.filter((m) => m.enabled && m.number).map((m) => ({ key: m.key, label: m.label, number: m.number, accountType: m.accountType })),
  });
});

export const submitPayment = asyncHandler(async (req: Request, res: Response) => {
  const { token, method, transactionId, senderNumber } = req.body as { token: string; method: PayMethod; transactionId: string; senderNumber: string };
  const order = await loadOrderWithToken(req.params.orderNumber, token);
  const r = await submitManualPayment(order, { method, transactionId, senderNumber });
  ok(res, { orderNumber: r.order.orderNumber, paymentStatus: r.order.paymentStatus, instantAccess: r.instant }, 201);
});
