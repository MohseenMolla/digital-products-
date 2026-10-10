import type { Request, Response } from 'express';
import { SiteSetting } from '../models/SiteSetting';
import { audit } from '../services/audit.service';
import { getPaymentConfig } from '../services/payment.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/helpers';

const getDoc = async () => (await SiteSetting.findOne({ key: 'main' })) ?? (await SiteSetting.create({ key: 'main' }));

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const s = await getDoc();
  const o = s.toObject() as unknown as Record<string, unknown>;
  delete o._id; delete o.__v; delete o.key;
  o.payment = await getPaymentConfig();
  ok(res, o);
});
export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const s = await getDoc();
  s.set(req.body);
  await s.save();
  await audit(req, 'SETTINGS_UPDATED', 'SiteSetting', 'main', 'Site settings updated');
  ok(res, s);
});
