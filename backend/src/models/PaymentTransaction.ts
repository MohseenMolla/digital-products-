import { Schema, model, Types } from 'mongoose';

export interface IPaymentTransaction {
  order: Types.ObjectId;
  transactionId: string;
  gatewayTransactionId?: string;
  paymentMethod?: string;
  amount: number;
  currency: string;
  fee: number;
  status: string;
  source: string;
  gatewayResponse: Record<string, unknown>;
  verifiedAt: Date;
  createdAt: Date;
}

const schema = new Schema<IPaymentTransaction>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    transactionId: { type: String, required: true, unique: true },
    gatewayTransactionId: String,
    paymentMethod: String,
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'BDT' },
    fee: { type: Number, default: 0 },
    status: { type: String, required: true },
    source: { type: String, default: 'redirect' },
    gatewayResponse: { type: Schema.Types.Mixed, default: {} },
    verifiedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);
schema.index({ createdAt: -1 });

export const PaymentTransaction = model<IPaymentTransaction>('PaymentTransaction', schema);
