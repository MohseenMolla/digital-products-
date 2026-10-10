import { Schema, model, Types } from 'mongoose';

export interface IPurchase {
  user: Types.ObjectId;
  product: Types.ObjectId;
  order: Types.ObjectId;
  accessStatus: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  accessGrantedAt: Date;
  expiresAt?: Date | null;
  downloadCount: number;
  lastDownloadAt?: Date;
  lastAccessedAt?: Date;
  revokedReason?: string;
  createdAt: Date;
}

const schema = new Schema<IPurchase>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    accessStatus: { type: String, enum: ['ACTIVE', 'EXPIRED', 'REVOKED'], default: 'ACTIVE' },
    accessGrantedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    downloadCount: { type: Number, default: 0 },
    lastDownloadAt: Date,
    lastAccessedAt: Date,
    revokedReason: String,
  },
  { timestamps: true },
);
schema.index({ user: 1, product: 1, accessStatus: 1 });
schema.index({ createdAt: -1 });

export const Purchase = model<IPurchase>('Purchase', schema);
