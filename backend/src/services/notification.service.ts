import type { Types } from 'mongoose';
import { Notification } from '../models/Notification';
import { logger } from '../utils/logger';

interface Payload { type: string; title: string; message?: string; link?: string; }

export async function notifyAdmins(p: Payload) {
  try { await Notification.create({ recipientRole: 'ADMIN', ...p }); } catch (e) { logger.warn({ err: (e as Error).message }, 'notifyAdmins failed'); }
}
export async function notifyUser(userId: Types.ObjectId | string, p: Payload) {
  try { await Notification.create({ recipient: userId, ...p }); } catch (e) { logger.warn({ err: (e as Error).message }, 'notifyUser failed'); }
}
