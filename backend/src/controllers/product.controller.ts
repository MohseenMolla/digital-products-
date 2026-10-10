import type { Request, Response } from 'express';
import axios from 'axios';
import type { HydratedDocument } from 'mongoose';
import { cloudinary } from '../config/cloudinary';
import { env } from '../config/env';
import { Category } from '../models/Category';
import { Product, type IProduct } from '../models/Product';
import { Purchase } from '../models/Purchase';
import { requireActivePurchase } from '../services/access.service';
import { streamProductFile } from '../services/file.service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { escapeRegex, isObjectId, ok, pageResult, parsePage } from '../utils/helpers';
import { logger } from '../utils/logger';

/** Public representation: strips every protected field (files, credentials, lesson videos, content). */
export function toPublic(p: HydratedDocument<IProduct> | (IProduct & { _id: unknown; category?: unknown })) {
  const o = typeof (p as HydratedDocument<IProduct>).toObject === 'function' ? (p as HydratedDocument<IProduct>).toObject() : (p as IProduct);
  return {
    id: String((o as unknown as { _id: unknown })._id), title: o.title, slug: o.slug, shortDescription: o.shortDescription, description: o.description,
    category: o.category, productType: o.productType, price: o.price, comparePrice: o.comparePrice,
    discountPercent: o.comparePrice > o.price ? Math.round(((o.comparePrice - o.price) / o.comparePrice) * 100) : 0,
    thumbnail: o.thumbnail, images: o.images?.map((i) => i.url) ?? [], status: o.status, featured: o.featured, bestseller: o.bestseller,
    stockStatus: o.stockStatus, accessType: o.accessType, duration: o.duration, downloadLimit: o.downloadLimit,
    features: o.features, whatYouGet: o.whatYouGet, faqs: o.faqs,
    courseModules: o.courseModules?.map((m) => ({ id: String(m._id), title: m.title, lessons: m.lessons.map((l) => ({ id: String(l._id), title: l.title, duration: l.duration })) })) ?? [],
    ratingAvg: o.ratingAvg, ratingCount: o.ratingCount, createdAt: o.createdAt,
  };
}

const SORTS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 }, price_asc: { price: 1 }, price_desc: { price: -1 }, popular: { bestseller: -1, featured: -1, createdAt: -1 },
};

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePage(req.query, 12, 48);
  const filter: Record<string, unknown> = { status: 'PUBLISHED' };
  const q = String(req.query.q ?? '').trim().slice(0, 80);
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    const cats = await Category.find({ name: rx }).select('_id');
    filter.$or = [{ title: rx }, { shortDescription: rx }, { description: rx }, { productType: rx }, { category: { $in: cats.map((c) => c._id) } }];
  }
  if (req.query.category) { const c = await Category.findOne({ slug: String(req.query.category) }); filter.category = c ? c._id : null; }
  if (req.query.productType) filter.productType = String(req.query.productType);
  if (req.query.featured === 'true') filter.featured = true;
  if (req.query.bestseller === 'true') filter.bestseller = true;
  const sort = SORTS[String(req.query.sort)] ?? SORTS.newest;
  const [items, total] = await Promise.all([
    Product.find(filter).populate('category', 'name slug').sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  ok(res, pageResult(items.map(toPublic), total, page, limit));
});

export const homeProducts = asyncHandler(async (_req: Request, res: Response) => {
  const base = { status: 'PUBLISHED' };
  const q = (extra: Record<string, unknown>, n = 8) => Product.find({ ...base, ...extra }).populate('category', 'name slug').sort({ createdAt: -1 }).limit(n);
  const [featured, courses, apps, resources] = await Promise.all([
    q({ featured: true }), q({ productType: 'COURSE' }, 4), q({ productType: 'PREMIUM_APP' }, 4), q({ productType: { $in: ['PDF', 'DIGITAL_PRODUCT'] } }, 4),
  ]);
  ok(res, { featured: featured.map(toPublic), courses: courses.map(toPublic), apps: apps.map(toPublic), resources: resources.map(toPublic) });
});

export const getBySlug = asyncHandler(async (req: Request, res: Response) => {
  const p = await Product.findOne({ slug: String(req.params.slug).toLowerCase(), status: 'PUBLISHED' }).populate('category', 'name slug');
  if (!p) throw new AppError(404, 'Product not found', 'NOT_FOUND');
  ok(res, toPublic(p));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  if (!isObjectId(req.params.id)) throw new AppError(400, 'Invalid product', 'BAD_REQUEST');
  const p = await Product.findOne({ _id: req.params.id, status: 'PUBLISHED' }).populate('category', 'name slug');
  if (!p) throw new AppError(404, 'Product not found', 'NOT_FOUND');
  ok(res, toPublic(p));
});

/** Protected file delivery for logged-in buyers. */
export const downloadFile = asyncHandler(async (req: Request, res: Response) => {
  const purchase = await requireActivePurchase(req.user!._id, req.params.id);
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError(404, 'Product not found', 'NOT_FOUND');
  await streamProductFile(res, purchase, product, req.query.disposition === 'inline', String(req.user!._id));
});
