import { Schema, model, Types } from 'mongoose';

export interface IAdminAuditLog {
  admin: Types.ObjectId;
  action: string;
  targetType: string;
  targetId: string;
  description: string;
  ip: string;
  createdAt: Date;
}

const schema = new Schema<IAdminAuditLog>(
  {
    admin: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true },
    targetId: { type: String, default: '' },
    description: { type: String, default: '' },
    ip: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
schema.index({ createdAt: -1 });

export const AdminAuditLog = model<IAdminAuditLog>('AdminAuditLog', schema);
