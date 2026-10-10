import type { Request, Response } from 'express';
import { Coupon } from '../models/Coupon';
import { Product } from '../models/Product';
import { audit } from '../services/audit.service';
import { applyCoupon, round2 } from '../services/pricing.service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/helpers';

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, productId } = req.body as { code: string; productId: string };
  const product = await Product.findOne({ _id: productId, status: 'PUBLISHED' });
  if (!product) throw new AppError(404, 'Product not found', 'NOT_FOUND');
  const { coupon, discount } = await applyCoupon(code, product.price);
  ok(res, { code: coupon.code, discount, total: round2(Math.max(product.price - discount, 0)) });
});

export const listCoupons = asyncHandler(async (_req: Request, res: Response) => ok(res, await Coupon.find().sort({ createdAt: -1 })));

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const c = await Coupon.create(toDoc(req.body));
  await audit(req, 'COUPON_CREATED', 'Coupon', String(c._id), c.code);
  ok(res, c, 201);
});
export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const c = await Coupon.findByIdAndUpdate(req.params.id, toDoc(req.body), { new: true, runValidators: true });
  if (!c) throw new AppError(404, 'Coupon not found', 'NOT_FOUND');
  await audit(req, 'COUPON_UPDATED', 'Coupon', String(c._id), c.code);
  ok(res, c);
});
export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  const c = await Coupon.findByIdAndDelete(req.params.id);
  if (!c) throw new AppError(404, 'Coupon not found', 'NOT_FOUND');
  await audit(req, 'COUPON_DELETED', 'Coupon', String(c._id), c.code);
  ok(res, null);
});

function toDoc(b: Record<string, unknown>) {
  return { ...b, expiresAt: b.expiresAt ? new Date(String(b.expiresAt)) : null };
}
