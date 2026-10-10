import crypto from 'crypto';
import type { Response } from 'express';
import { Types } from 'mongoose';
import { env } from '../config/env';

export const ok = (res: Response, data: unknown = null, status = 200, message?: string) =>
  res.status(status).json({ success: true, message, data });

export function parsePage(q: Record<string, unknown>, defaultLimit = 12, maxLimit = 100) {
  const page = Math.max(1, parseInt(String(q.page ?? '1'), 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(String(q.limit ?? defaultLimit), 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export const pageResult = <T>(items: T[], total: number, page: number, limit: number) => ({
  items, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)),
});

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const isObjectId = (v: unknown): v is string => typeof v === 'string' && /^[a-f\d]{24}$/i.test(v) && Types.ObjectId.isValid(v);

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'item';

export function generateOrderNumber(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `ORD-${ymd}-${rand}`;
}

const key = () => crypto.createHash('sha256').update(env.ENCRYPTION_KEY).digest();

export function encrypt(plain: string): string {
  if (!plain) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv.toString('base64'), cipher.getAuthTag().toString('base64'), enc.toString('base64')].join('.');
}

export function decrypt(payload: string): string {
  if (!payload) return '';
  try {
    const [iv, tag, data] = payload.split('.');
    const d = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'));
    d.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([d.update(Buffer.from(data, 'base64')), d.final()]).toString('utf8');
  } catch {
    return '';
  }
}
