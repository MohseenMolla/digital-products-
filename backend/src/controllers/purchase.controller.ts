import type { Request, Response } from 'express';
import { Purchase } from '../models/Purchase';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { CourseProgress } from '../models/CourseProgress';
import { buildAccessPayload, effectiveStatus, findActivePurchase, requireActivePurchase } from '../services/access.service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { decrypt, ok } from '../utils/helpers';

interface PopProduct { _id: unknown; title: string; slug: string; thumbnail: string; productType: string; accessType: string; }
interface PopOrder { orderNumber: string; paymentStatus: string; amount: number; }

export const myPurchases = asyncHandler(async (req: Request, res: Response) => {
  const list = await Purchase.find({ user: req.user!._id }).sort({ createdAt: -1 })
    .populate('product', 'title slug thumbnail productType accessType').populate('order', 'orderNumber paymentStatus amount');
  ok(res, list.filter((p) => p.product).map((p) => {
    const prod = p.product as unknown as PopProduct; const ord = p.order as unknown as PopOrder | null;
    return {
      id: String(p._id), productId: String(prod._id), title: prod.title, slug: prod.slug, thumbnail: prod.thumbnail,
      productType: prod.productType, accessType: prod.accessType, accessStatus: effectiveStatus(p),
      purchasedAt: p.accessGrantedAt, expiresAt: p.expiresAt, downloadCount: p.downloadCount,
      orderNumber: ord?.orderNumber, paymentStatus: ord?.paymentStatus, amount: ord?.amount,
    };
  }));
});

export const checkOwned = asyncHandler(async (req: Request, res: Response) => {
  const { active } = await findActivePurchase(req.user!._id, req.params.productId);
  ok(res, { owned: Boolean(active) });
});

/** Protected content for a purchased product. */
export const accessProduct = asyncHandler(async (req: Request, res: Response) => {
  const purchase = await requireActivePurchase(req.user!._id, req.params.productId);
  const p = await Product.findById(req.params.productId);
  if (!p) throw new AppError(404, 'Product not found', 'NOT_FOUND');
  purchase.lastAccessedAt = new Date();
  await purchase.save();
  ok(res, buildAccessPayload(p, purchase));
});

export const dashboardSummary = asyncHandler(async (req: Request, res: Response) => {
  const purchases = await Purchase.find({ user: req.user!._id }).populate('product', 'productType');
  const active = purchases.filter((p) => effectiveStatus(p) === 'ACTIVE');
  const type = (p: (typeof purchases)[number]) => (p.product as unknown as { productType: string } | null)?.productType;
  const [orders, progress] = await Promise.all([Order.countDocuments({ user: req.user!._id, paymentStatus: 'PAID' }), CourseProgress.countDocuments({ user: req.user!._id })]);
  ok(res, {
    totalPurchases: orders, activeProducts: active.length,
    courses: purchases.filter((p) => type(p) === 'COURSE').length,
    downloads: purchases.reduce((s, p) => s + p.downloadCount, 0), coursesInProgress: progress,
  });
});
