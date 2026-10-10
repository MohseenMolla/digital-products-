import type { Request, Response } from 'express';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { audit } from '../services/audit.service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, slugify } from '../utils/helpers';

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const cats = await Category.find().sort({ order: 1, name: 1 });
  ok(res, cats.map((c) => ({ id: String(c._id), name: c.name, slug: c.slug, description: c.description, order: c.order })));
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const b = req.body as { name: string; slug?: string; description: string; order: number };
  const c = await Category.create({ ...b, slug: slugify(b.slug || b.name) });
  await audit(req, 'CATEGORY_CREATED', 'Category', String(c._id), c.name);
  ok(res, c, 201);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const b = req.body as { name: string; slug?: string; description: string; order: number };
  const c = await Category.findByIdAndUpdate(req.params.id, { ...b, slug: slugify(b.slug || b.name) }, { new: true, runValidators: true });
  if (!c) throw new AppError(404, 'Category not found', 'NOT_FOUND');
  await audit(req, 'CATEGORY_UPDATED', 'Category', String(c._id), c.name);
  ok(res, c);
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  if (await Product.exists({ category: req.params.id })) throw new AppError(409, 'Category is used by products', 'IN_USE');
  const c = await Category.findByIdAndDelete(req.params.id);
  if (!c) throw new AppError(404, 'Category not found', 'NOT_FOUND');
  await audit(req, 'CATEGORY_DELETED', 'Category', String(c._id), c.name);
  ok(res, null);
});
