import { Coupon } from '../models/Coupon';
import { AppError } from '../utils/AppError';

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function applyCoupon(code: string, subtotal: number) {
  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), active: true });
  if (!coupon) throw new AppError(422, 'Invalid coupon code', 'COUPON_INVALID');
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) throw new AppError(422, 'This coupon has expired', 'COUPON_EXPIRED');
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) throw new AppError(422, 'This coupon has reached its usage limit', 'COUPON_EXHAUSTED');
  if (subtotal < coupon.minimumAmount) throw new AppError(422, `Minimum order amount for this coupon is ৳${coupon.minimumAmount}`, 'COUPON_MIN');
  let discount = coupon.type === 'PERCENTAGE' ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.maximumDiscount > 0) discount = Math.min(discount, coupon.maximumDiscount);
  discount = round2(Math.min(discount, subtotal));
  return { coupon, discount };
}

export { round2 };
