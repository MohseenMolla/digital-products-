import type { Request } from 'express';
import { AdminAuditLog } from '../models/AdminAuditLog';
import { logger } from '../utils/logger';

export async function audit(req: Request, action: string, targetType: string, targetId: string, description = '') {
  if (!req.user) return;
  try {
    await AdminAuditLog.create({ admin: req.user._id, action, targetType, targetId, description, ip: req.ip || '' });
    logger.info({ action, targetType, targetId, admin: String(req.user._id) }, 'Admin action');
  } catch (e) { logger.warn({ err: (e as Error).message }, 'Audit log failed'); }
}
