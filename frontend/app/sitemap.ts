import type { MetadataRoute } from 'next';
import { sget } from '@/lib/server-api';
import type { Category, Paged, Product } from '@/types';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, cats] = await Promise.all([sget<Paged<Product>>('/products?limit=48', 600), sget<Category[]>('/categories', 600)]);
  return [
    { url: SITE, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/products`, changeFrequency: 'daily', priority: 0.9 },
    ...(cats ?? []).map((c) => ({ url: `${SITE}/category/${c.slug}`, changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...(products?.items ?? []).map((p) => ({ url: `${SITE}/products/${p.slug}`, changeFrequency: 'weekly' as const, priority: 0.8 })),
  ];
}
