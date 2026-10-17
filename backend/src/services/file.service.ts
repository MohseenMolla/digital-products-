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
  if (!product.pdfPublicId && !product.pdfUrl) throw new AppError(404, 'No file is attached to this product', 'NOT_FOUND');
  if (product.downloadExpiry > 0 && purchase.accessGrantedAt.getTime() + product.downloadExpiry * 86_400_000 < Date.now()) {
    throw new AppError(403, 'The download window for this product has expired', 'DOWNLOAD_EXPIRED');
  }
  if (!inline) {
    const filter: Record<string, unknown> = { _id: purchase._id };
    if (product.downloadLimit > 0) filter.downloadCount = { $lt: product.downloadLimit }; // atomic limit
    const updated = await Purchase.findOneAndUpdate(filter, { $inc: { downloadCount: 1 }, lastDownloadAt: new Date(), lastAccessedAt: new Date() });
    if (!updated) throw new AppError(403, 'Download limit reached', 'DOWNLOAD_LIMIT');
  }

  const candidates: string[] = [];

  if (product.pdfPublicId && env.cloudinaryConfigured) {
    try {
      const extMatch = product.pdfPublicId.match(/\.([a-zA-Z0-9]+)$/);
      const ext = extMatch ? extMatch[1] : '';
      const baseId = ext ? product.pdfPublicId.replace(/\.[a-zA-Z0-9]+$/, '') : product.pdfPublicId;

      // 1. Cloudinary API private download URL (official endpoint for authenticated assets)
      candidates.push(cloudinary.utils.private_download_url(product.pdfPublicId, '', { resource_type: 'raw', type: 'authenticated' }));
      if (ext) {
        candidates.push(cloudinary.utils.private_download_url(baseId, ext, { resource_type: 'raw', type: 'authenticated' }));
      }
      // 2. Cloudinary API private download URL for upload type (if asset was uploaded as public upload)
      candidates.push(cloudinary.utils.private_download_url(product.pdfPublicId, '', { resource_type: 'raw', type: 'upload' }));
      // 3. Cloudinary API private download URL for image resource_type
      candidates.push(cloudinary.utils.private_download_url(product.pdfPublicId, '', { resource_type: 'image', type: 'authenticated' }));
      // 4. Cloudinary signed CDN URL
      candidates.push(cloudinary.url(product.pdfPublicId, { resource_type: 'raw', type: 'authenticated', sign_url: true, secure: true }));
      // 5. Cloudinary public CDN URL
      candidates.push(cloudinary.url(product.pdfPublicId, { resource_type: 'raw', type: 'upload', secure: true }));
      candidates.push(cloudinary.url(product.pdfPublicId, { resource_type: 'image', secure: true }));
    } catch (e) {
      logger.warn({ err: (e as Error).message }, 'Failed generating Cloudinary candidate URLs');
    }
  }

  // Fallback to direct pdfUrl if present
  if (product.pdfUrl && typeof product.pdfUrl === 'string' && product.pdfUrl.startsWith('http')) {
    candidates.push(product.pdfUrl);
  }

  // Fallback to externalUrl if present
  if (product.externalUrl && typeof product.externalUrl === 'string' && product.externalUrl.startsWith('http')) {
    candidates.push(product.externalUrl);
  }

  let upstream: any = null;
  const errorDetails: string[] = [];

  for (const url of candidates) {
    if (!url) continue;
    try {
      const resp = await axios.get(url, { responseType: 'stream', timeout: 30000 });
      if (resp && resp.status >= 200 && resp.status < 300) {
        upstream = resp;
        break;
      }
    } catch (e: any) {
      errorDetails.push(`${url.slice(0, 50)}...: ${e.response?.status || e.message}`);
    }
  }

  if (!upstream) {
    logger.error({ productId: String(product._id), errors: errorDetails, who }, 'All file fetch candidates failed');
    // If product has a direct external link, redirect as ultimate fallback
    if (product.externalUrl && product.externalUrl.startsWith('http')) {
      return res.redirect(product.externalUrl);
    }
    if (product.pdfUrl && product.pdfUrl.startsWith('http')) {
      return res.redirect(product.pdfUrl);
    }
    throw new AppError(502, 'Could not fetch the file right now. Please verify the file in admin panel.', 'STORAGE_ERROR');
  }

  let name = (product.fileName || 'download').trim().replace(/[^\w.\- ]/g, '_');
  if (!/\.[a-zA-Z0-9]+$/.test(name)) {
    name = `${name}.pdf`;
  }

  const contentType = String(upstream.headers['content-type'] || 'application/pdf');
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${name}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  logger.info({ productId: String(product._id), who, inline, contentType, name }, 'File delivered successfully');
  upstream.data.pipe(res);
}
