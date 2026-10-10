import { Schema, model, Types } from 'mongoose';

export interface INotification {
  recipient?: Types.ObjectId;
  recipientRole?: 'ADMIN';
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: Date;
}

const schema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    recipientRole: { type: String, enum: ['ADMIN'], index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);
schema.index({ createdAt: -1 });

export const Notification = model<INotification>('Notification', schema);
