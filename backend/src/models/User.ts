import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

export type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface IUser {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  isActive: boolean;
  tokenVersion: number;
  mustChangePassword: boolean;
  isGuest: boolean;
  resetTokenHash?: string;
  resetTokenExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '', trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['USER', 'ADMIN', 'SUPER_ADMIN'], default: 'USER' },
    isActive: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
    mustChangePassword: { type: Boolean, default: false },
    isGuest: { type: Boolean, default: false },
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
  },
  { timestamps: true },
);
schema.index({ createdAt: -1 });
schema.index({ name: 'text', email: 'text' });

schema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

export const User = model<IUser>('User', schema);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);
