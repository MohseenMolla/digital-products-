import axios from 'axios';
import type { Response } from 'express';
import type { HydratedDocument } from 'mongoose';
import { cloudinary } from '../config/cloudinary';
import { env } from '../config/env';
import type { IProduct } from '../models/Product';
import { Purchase, type IPurchase } from '../models/Purchase';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

/**
 * Streams a protected file after the CALLER has verified the purchase.
 * Enforces download window and limit, counts the download, and never exposes the storage URL.
 */
export async function streamProductFile(res: Response, purchase: HydratedDocument<IPurchase>, product: HydratedDocument<IProduct>, inline: boolean, who: string) {
  if (!product.pdfPublicId) throw new AppError(404, 'No file is attached to this product', 'NOT_FOUND');
  if (!env.cloudinaryConfigured) throw new AppError(503, 'File storage is not configured', 'STORAGE_UNAVAILABLE');
  if (product.downloadExpiry > 0 && purchase.accessGrantedAt.getTime() + product.downloadExpiry * 86_400_000 < Date.now()) {
    throw new AppError(403, 'The download window for this product has expired', 'DOWNLOAD_EXPIRED');
  }
  if (!inline) {
    const filter: Record<string, unknown> = { _id: purchase._id };
    if (product.downloadLimit > 0) filter.downloadCount = { $lt: product.downloadLimit }; // atomic limit
    const updated = await Purchase.findOneAndUpdate(filter, { $inc: { downloadCount: 1 }, lastDownloadAt: new Date(), lastAccessedAt: new Date() });
    if (!updated) throw new AppError(403, 'Download limit reached', 'DOWNLOAD_LIMIT');
  }
  const signed = cloudinary.url(product.pdfPublicId, { resource_type: 'raw', type: 'authenticated', sign_url: true, secure: true });
  try {
    const upstream = await axios.get(signed, { responseType: 'stream', timeout: 30000 });
    const name = (product.fileName || 'download').replace(/[^\w.\- ]/g, '_');
    res.setHeader('Content-Type', String(upstream.headers['content-type'] || 'application/octet-stream'));
    res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${name}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    logger.info({ productId: String(product._id), who, inline }, 'File delivered');
    upstream.data.pipe(res);
  } catch (e) {
    logger.error({ err: (e as Error).message }, 'File fetch failed');
    throw new AppError(502, 'Could not fetch the file right now', 'STORAGE_ERROR');
  }
}
