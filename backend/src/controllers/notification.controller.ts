import type { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/helpers';

const scope = (req: Request) => {
  const admin = req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN';
  return admin ? { $or: [{ recipient: req.user!._id }, { recipientRole: 'ADMIN' }] } : { recipient: req.user!._id };
};

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const [items, unread] = await Promise.all([
    Notification.find(scope(req)).sort({ createdAt: -1 }).limit(30),
    Notification.countDocuments({ ...scope(req), read: false }),
  ]);
  ok(res, { items, unread });
});
export const markRead = asyncHandler(async (req: Request, res: Response) => {
  await Notification.updateOne({ _id: req.params.id, ...scope(req) }, { read: true });
  ok(res, null);
});
export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await Notification.updateMany({ ...scope(req), read: false }, { read: true });
  ok(res, null);
});
