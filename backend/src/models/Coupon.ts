import { Schema, model } from 'mongoose';

export interface ICoupon {
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minimumAmount: number;
  maximumDiscount: number;
  usageLimit: number;
  usedCount: number;
  expiresAt?: Date | null;
  active: boolean;
}

const schema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['PERCENTAGE', 'FIXED'], required: true },
    value: { type: Number, required: true, min: 0 },
    minimumAmount: { type: Number, default: 0 },
    maximumDiscount: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Coupon = model<ICoupon>('Coupon', schema);
