import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import path from 'path';
import { cloudinary } from '../config/cloudinary';
import { env } from '../config/env';
import { UPLOAD_RULES, type UploadKind } from '../middleware/upload';
import { AdminAuditLog } from '../models/AdminAuditLog';
import { Order } from '../models/Order';
import { PaymentTransaction } from '../models/PaymentTransaction';
import { Product } from '../models/Product';
import { Purchase } from '../models/Purchase';
import { User } from '../models/User';
import { effectiveStatus } from '../services/access.service';
import { audit } from '../services/audit.service';
import { approveOrder, rejectOrder } from '../services/payment.service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { decrypt, encrypt, escapeRegex, isObjectId, ok, pageResult, parsePage, slugify } from '../utils/helpers';
import { logger } from '../utils/logger';

/* ---------- Products ---------- */
async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base); let slug = root; let i = 1;
  while (await Product.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) slug = `${root}-${++i}`;
  return slug;
}

function toProductDoc(b: Record<string, unknown>) {
  const { appCredentials, category, slug: _slug, ...rest } = b as { appCredentials: { loginEmail: string; password: string; loginUrl: string; notes: string; expiresAt?: string | null }; category?: string | null; slug?: string };
  return {
    ...rest,
    category: category || undefined,
    appCredentials: { loginEmail: appCredentials.loginEmail, passwordEnc: encrypt(appCredentials.password), loginUrl: appCredentials.loginUrl, notes: appCredentials.notes, expiresAt: appCredentials.expiresAt ? new Date(appCredentials.expiresAt) : null },
  };
}

function adminProduct(p: InstanceType<typeof Product>) {
  const o = p.toObject() as unknown as Record<string, unknown> & { appCredentials: { loginEmail: string; passwordEnc: string; loginUrl: string; notes: string; expiresAt?: Date | null }; courseModules: { _id: unknown; lessons: { _id: unknown }[] }[] };
  const { passwordEnc, ...c } = o.appCredentials;
  return { ...o, id: String(p._id), appCredentials: { ...c, password: decrypt(passwordEnc) } };
}

export const adminListProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePage(req.query, 20);
  const filter: Record<string, unknown> = {};
  const q = String(req.query.q ?? '').trim();
  if (q) filter.title = new RegExp(escapeRegex(q), 'i');
  if (req.query.productType) filter.productType = String(req.query.productType);
  if (req.query.status) filter.status = String(req.query.status);
  const [items, total] = await Promise.all([
    Product.find(filter).populate('category', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit).select('title slug price productType status featured thumbnail category createdAt courseModules'),
    Product.countDocuments(filter),
  ]);
  ok(res, pageResult(items.map((p) => ({ id: String(p._id), title: p.title, slug: p.slug, price: p.price, productType: p.productType, status: p.status, featured: p.featured, thumbnail: p.thumbnail, category: p.category, createdAt: p.createdAt, lessons: p.courseModules.reduce((n, m) => n + m.lessons.length, 0) })), total, page, limit));
});

export const adminGetProduct = asyncHandler(async (req: Request, res: Response) => {
  const p = await Product.findById(req.params.id);
  if (!p) throw new AppError(404, 'Product not found', 'NOT_FOUND');
  ok(res, adminProduct(p));
});

export const adminCreateProduct = asyncHandler(async (req: Request, res: Response) => {
  const slug = await uniqueSlug((req.body.slug as string) || (req.body.title as string));
  const p = await Product.create({ ...toProductDoc(req.body), slug });
  await audit(req, 'PRODUCT_CREATED', 'Product', String(p._id), p.title);
  ok(res, adminProduct(p), 201);
});

export const adminUpdateProduct = asyncHandler(async (req: Request, res: Response) => {
  const existing = await Product.findById(req.params.id);
  if (!existing) throw new AppError(404, 'Product not found', 'NOT_FOUND');
  const slug = await uniqueSlug((req.body.slug as string) || existing.slug, String(existing._id));
  existing.set({ ...toProductDoc(req.body), slug });
  await existing.save();
  await audit(req, 'PRODUCT_UPDATED', 'Product', String(existing._id), existing.title);
  ok(res, adminProduct(existing));
});

export const adminDeleteProduct = asyncHandler(async (req: Request, res: Response) => {
  if (await Order.exists({ product: req.params.id, paymentStatus: 'PAID' })) {
    throw new AppError(409, 'This product has paid orders. Unpublish it instead of deleting.', 'HAS_ORDERS');
  }
  const p = await Product.findByIdAndDelete(req.params.id);
  if (!p) throw new AppError(404, 'Product not found', 'NOT_FOUND');
  await audit(req, 'PRODUCT_DELETED', 'Product', String(p._id), p.title);
  ok(res, null);
});

/* ---------- Orders ---------- */
export const adminListOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePage(req.query, 20);
  const filter: Record<string, unknown> = {};
  const status = String(req.query.status ?? '');
  if (status && status !== 'ALL') filter.paymentStatus = status;
  const q = String(req.query.q ?? '').trim();
  if (q) { const rx = new RegExp(escapeRegex(q), 'i'); filter.$or = [{ orderNumber: rx }, { customerEmail: rx }, { customerPhone: rx }, { transactionId: rx }]; }
  const [items, total] = await Promise.all([Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit), Order.countDocuments(filter)]);
  ok(res, pageResult(items, total, page, limit));
});

export const adminGetOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError(404, 'Order not found', 'NOT_FOUND');
  const [transactions, purchase] = await Promise.all([PaymentTransaction.find({ order: order._id }).sort({ createdAt: -1 }), Purchase.findOne({ order: order._id })]);
  ok(res, { order, transactions, purchase: purchase ? { id: String(purchase._id), accessStatus: effectiveStatus(purchase), accessGrantedAt: purchase.accessGrantedAt, expiresAt: purchase.expiresAt, downloadCount: purchase.downloadCount, revokedReason: purchase.revokedReason } : null });
});

export const adminApprove = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError(404, 'Order not found', 'NOT_FOUND');
  if (order.paymentStatus === 'PAID') throw new AppError(409, 'Order is already paid', 'ALREADY_PAID');
  const { note } = req.body as { note: string };
  await audit(req, 'ORDER_PAYMENT_APPROVED', 'Order', String(order._id), `${order.orderNumber} ${order.paymentMethod ?? ''} ${order.transactionId ?? 'no TrxID'}${note ? `: ${note}` : ''}`);
  await approveOrder(order, { id: String(req.user!._id) }, note);
  ok(res, null);
});

export const adminReject = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError(404, 'Order not found', 'NOT_FOUND');
  const { reason } = req.body as { reason: string };
  await rejectOrder(order, reason);
  await audit(req, 'ORDER_PAYMENT_REJECTED', 'Order', String(order._id), `${order.orderNumber}: ${reason}`);
  ok(res, null);
});

/* ---------- Purchases ---------- */
export const adminListPurchases = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePage(req.query, 20);
  const filter: Record<string, unknown> = {};
  if (req.query.user && isObjectId(req.query.user)) filter.user = req.query.user;
  const [items, total] = await Promise.all([
    Purchase.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'name email').populate('product', 'title').populate('order', 'orderNumber'),
    Purchase.countDocuments(filter),
  ]);
  ok(res, pageResult(items.map((p) => ({ id: String(p._id), user: p.user, product: p.product, order: p.order, accessStatus: effectiveStatus(p), accessGrantedAt: p.accessGrantedAt, expiresAt: p.expiresAt, downloadCount: p.downloadCount, revokedReason: p.revokedReason })), total, page, limit));
});

export const adminRevoke = asyncHandler(async (req: Request, res: Response) => {
  const p = await Purchase.findByIdAndUpdate(req.params.id, { accessStatus: 'REVOKED', revokedReason: (req.body as { reason: string }).reason }, { new: true });
  if (!p) throw new AppError(404, 'Purchase not found', 'NOT_FOUND');
  await audit(req, 'ACCESS_REVOKED', 'Purchase', String(p._id), p.revokedReason);
  logger.info({ purchaseId: String(p._id) }, 'Access revoked');
  ok(res, null);
});

export const adminRestore = asyncHandler(async (req: Request, res: Response) => {
  const p = await Purchase.findByIdAndUpdate(req.params.id, { accessStatus: 'ACTIVE', revokedReason: undefined }, { new: true });
  if (!p) throw new AppError(404, 'Purchase not found', 'NOT_FOUND');
  await audit(req, 'ACCESS_RESTORED', 'Purchase', String(p._id));
  ok(res, null);
});

/* ---------- Users ---------- */
export const adminListUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePage(req.query, 20);
  const filter: Record<string, unknown> = {};
  const q = String(req.query.q ?? '').trim();
  if (q) { const rx = new RegExp(escapeRegex(q), 'i'); filter.$or = [{ name: rx }, { email: rx }, { phone: rx }]; }
  const [items, total] = await Promise.all([User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit), User.countDocuments(filter)]);
  ok(res, pageResult(items.map((u) => ({ id: String(u._id), name: u.name, email: u.email, phone: u.phone, role: u.role, isActive: u.isActive, createdAt: u.createdAt })), total, page, limit));
});

export const adminGetUser = asyncHandler(async (req: Request, res: Response) => {
  const u = await User.findById(req.params.id);
  if (!u) throw new AppError(404, 'User not found', 'NOT_FOUND');
  const [purchases, orders] = await Promise.all([
    Purchase.find({ user: u._id }).sort({ createdAt: -1 }).populate('product', 'title'),
    Order.find({ user: u._id }).sort({ createdAt: -1 }).limit(50),
  ]);
  ok(res, {
    user: { id: String(u._id), name: u.name, email: u.email, phone: u.phone, role: u.role, isActive: u.isActive, createdAt: u.createdAt },
    purchases: purchases.map((p) => ({ id: String(p._id), product: p.product, accessStatus: effectiveStatus(p), accessGrantedAt: p.accessGrantedAt, expiresAt: p.expiresAt })),
    orders,
  });
});

export const adminUpdateUser = asyncHandler(async (req: Request, res: Response) => {
  const b = req.body as { name: string; phone: string; isActive: boolean; role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN' };
  const u = await User.findById(req.params.id);
  if (!u) throw new AppError(404, 'User not found', 'NOT_FOUND');
  const self = String(u._id) === String(req.user!._id);
  if (self && !b.isActive) throw new AppError(409, 'You cannot disable your own account', 'FORBIDDEN');
  if (b.role && b.role !== u.role) {
    if (req.user!.role !== 'SUPER_ADMIN') throw new AppError(403, 'Only a super admin can change roles', 'FORBIDDEN');
    if (self) throw new AppError(409, 'You cannot change your own role', 'FORBIDDEN');
    u.role = b.role;
  }
  const wasActive = u.isActive;
  u.name = b.name; u.phone = b.phone; u.isActive = b.isActive;
  if (wasActive && !b.isActive) u.tokenVersion += 1;
  await u.save();
  if (wasActive !== b.isActive) await audit(req, b.isActive ? 'USER_ENABLED' : 'USER_DISABLED', 'User', String(u._id), u.email);
  else await audit(req, 'USER_UPDATED', 'User', String(u._id), u.email);
  ok(res, null);
});

/* ---------- Payments, audit ---------- */
export const adminListPayments = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePage(req.query, 20);
  const [items, total] = await Promise.all([
    PaymentTransaction.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate('order', 'orderNumber customerEmail'),
    PaymentTransaction.countDocuments(),
  ]);
  ok(res, pageResult(items, total, page, limit));
});

export const adminAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePage(req.query, 30);
  const [items, total] = await Promise.all([AdminAuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate('admin', 'name email'), AdminAuditLog.countDocuments()]);
  ok(res, pageResult(items, total, page, limit));
});

/* ---------- Stats ---------- */
export const adminStats = asyncHandler(async (_req: Request, res: Response) => {
  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const since = new Date(Date.now() - 29 * 86_400_000); since.setHours(0, 0, 0, 0);
  const sum = async (match: Record<string, unknown>) => (await Order.aggregate([{ $match: { paymentStatus: 'PAID', ...match } }, { $group: { _id: null, t: { $sum: '$amount' } } }]))[0]?.t ?? 0;

  const [totalRevenue, todayRevenue, monthRevenue, totalOrders, paidOrders, pendingOrders, failedPayments, totalUsers, totalProducts, totalCourses, byDay, topProducts, methods, recent] = await Promise.all([
    sum({}), sum({ paidAt: { $gte: startOfDay } }), sum({ paidAt: { $gte: startOfMonth } }),
    Order.countDocuments(), Order.countDocuments({ paymentStatus: 'PAID' }), Order.countDocuments({ paymentStatus: { $in: ['PENDING', 'PROCESSING'] } }),
    Order.countDocuments({ paymentStatus: { $in: ['FAILED', 'PAYMENT_MISMATCH'] } }),
    User.countDocuments(), Product.countDocuments(), Product.countDocuments({ productType: 'COURSE' }),
    Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Dhaka' } }, orders: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, '$amount', 0] } } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([{ $match: { paymentStatus: 'PAID' } }, { $group: { _id: '$productTitleSnapshot', sales: { $sum: 1 }, revenue: { $sum: '$amount' } } }, { $sort: { revenue: -1 } }, { $limit: 5 }]),
    Order.aggregate([{ $match: { paymentStatus: 'PAID' } }, { $group: { _id: { $ifNull: ['$paymentMethod', 'Unknown'] }, count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Order.find().sort({ createdAt: -1 }).limit(8),
  ]);
  const conversion = totalOrders ? Math.round((paidOrders / totalOrders) * 100) : 0;
  ok(res, {
    totals: { totalRevenue, todayRevenue, monthRevenue, totalOrders, paidOrders, pendingOrders, failedPayments, totalUsers, totalProducts, totalCourses, conversion },
    revenueByDay: byDay.map((d) => ({ date: d._id as string, revenue: d.revenue as number, orders: d.orders as number })),
    topProducts: topProducts.map((t) => ({ title: t._id as string, sales: t.sales as number, revenue: t.revenue as number })),
    paymentMethods: methods.map((m) => ({ method: m._id as string, count: m.count as number })),
    recentOrders: recent,
  });
});

/* ---------- Uploads (Cloudinary) ---------- */
const FOLDERS: Record<UploadKind, string> = { image: 'digital-platform/products', pdf: 'digital-platform/pdfs', resource: 'digital-platform/resources' };

export const uploadFile = asyncHandler(async (req: Request, res: Response) => {
  if (!env.cloudinaryConfigured) throw new AppError(503, 'Cloudinary is not configured', 'STORAGE_UNAVAILABLE');
  const file = req.file;
  if (!file) throw new AppError(400, 'No file uploaded', 'UPLOAD_ERROR');
  const kind = String(req.query.kind || 'image') as UploadKind;
  const rule = UPLOAD_RULES[kind];
  if (file.size > rule.maxBytes) throw new AppError(422, `File too large (max ${Math.round(rule.maxBytes / 1048576)}MB)`, 'UPLOAD_SIZE');
  const folderOverride = req.query.folder === 'courses' && kind === 'image' ? 'digital-platform/courses' : FOLDERS[kind];
  const isImage = kind === 'image';
  const ext = path.extname(file.originalname).toLowerCase();
  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      isImage
        ? { folder: folderOverride, resource_type: 'image' }
        : { public_id: `${folderOverride}/${randomUUID()}${ext}`, resource_type: 'raw', type: 'authenticated' },
      (err, r) => (err || !r ? reject(err ?? new Error('upload failed')) : resolve(r)),
    );
    stream.end(file.buffer);
  });
  logger.info({ kind, size: file.size }, 'File uploaded');
  ok(res, { url: result.secure_url, publicId: result.public_id, fileName: file.originalname }, 201);
});

export const deleteUpload = asyncHandler(async (req: Request, res: Response) => {
  if (!env.cloudinaryConfigured) throw new AppError(503, 'Cloudinary is not configured', 'STORAGE_UNAVAILABLE');
  const { publicId, kind } = req.body as { publicId?: string; kind?: string };
  if (!publicId || !publicId.startsWith('digital-platform/')) throw new AppError(400, 'Invalid file reference', 'BAD_REQUEST');
  const isImage = kind !== 'pdf' && kind !== 'resource';
  await cloudinary.uploader.destroy(publicId, isImage ? { resource_type: 'image' } : { resource_type: 'raw', type: 'authenticated' });
  ok(res, null);
});
