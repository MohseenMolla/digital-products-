import type { Request, Response } from 'express';
import { Order } from '../models/Order';
import { createCheckout } from '../services/checkout.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/helpers';

/** Works for guests and logged-in users (optionalAuth). */
export const checkout = asyncHandler(async (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
  req.body.attribution = {
    ...(req.body.attribution || {}),
    clientIp,
    userAgent: req.headers['user-agent'],
    fbp: req.cookies?._fbp,
    fbc: req.cookies?._fbc,
    ttp: req.cookies?._ttp,
  };
  const r = await createCheckout(req.user ?? null, req.body);
  ok(res, r, 201);
});

export const myOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await Order.find({ user: req.user!._id }).sort({ createdAt: -1 }).limit(100);
  ok(res, orders.map((o) => ({
    id: String(o._id), orderNumber: o.orderNumber, product: String(o.product), productTitle: o.productTitleSnapshot,
    amount: o.amount, paymentStatus: o.paymentStatus, orderStatus: o.orderStatus, createdAt: o.createdAt, paidAt: o.paidAt,
  })));
});
