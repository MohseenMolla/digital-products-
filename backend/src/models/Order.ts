import { Schema, model, Types } from 'mongoose';

export const PAYMENT_STATUSES = ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED', 'PAYMENT_MISMATCH'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';

export interface IOrder {
  orderNumber: string;
  user: Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  product: Types.ObjectId;
  productTitleSnapshot: string;
  subtotal: number;
  discount: number;
  couponCode?: string;
  amount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentMethod?: string;
  transactionId?: string;
  gatewayTransactionId?: string;
  paymentFee?: number;
  attribution?: Record<string, unknown>;
  metadata: Record<string, unknown>;
  timeline: { event: string; note: string; at: Date }[];
  paidAt?: Date;
  accessTokenEnc?: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true, lowercase: true },
    customerPhone: { type: String, required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productTitleSnapshot: { type: String, required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'BDT' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'PENDING' },
    orderStatus: { type: String, enum: ['PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED'], default: 'PENDING' },
    paymentMethod: String,
    transactionId: { type: String, unique: true, sparse: true },
    gatewayTransactionId: String,
    paymentFee: Number,
    attribution: { type: Schema.Types.Mixed, default: {} },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timeline: [{ _id: false, event: String, note: String, at: { type: Date, default: Date.now } }],
    paidAt: Date,
    accessTokenEnc: { type: String, select: false },
  },
  { timestamps: true },
);
schema.index({ createdAt: -1 });
schema.index({ paymentStatus: 1, createdAt: -1 });
schema.index({ customerEmail: 1 });
schema.index({ customerPhone: 1 });

export const Order = model<IOrder>('Order', schema);
