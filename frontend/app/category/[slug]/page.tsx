import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Filter } from '@/components/Filter';
import { ProductGrid } from '@/components/ProductGrid';
import { Pagination } from '@/components/ui/Pagination';
import { sget } from '@/lib/server-api';
import type { Category, Paged, Product } from '@/types';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

async function getCat(slug: string) { return (await sget<Category[]>('/categories', 120))?.find((c) => c.slug === slug) ?? null; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const c = await getCat(slug);
  return c ? { title: c.name, description: c.description || `Browse ${c.name}`, alternates: { canonical: `/category/${slug}` } } : {};
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params; const sp = await searchParams;
  const cat = await getCat(slug);
  if (!cat) notFound();
  const qs = new URLSearchParams({ category: slug, limit: '12' });
  for (const k of ['sort', 'page', 'productType']) if (sp[k]) qs.set(k, sp[k]!);
  const data = await sget<Paged<Product>>(`/products?${qs}`, 30);
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-bold tracking-tight">{cat.name}</h1>
      {cat.description && <p className="mt-2 text-slate-600">{cat.description}</p>}
      <div className="mt-5"><Suspense><Filter categories={[]} hideCategory /></Suspense></div>
      <div className="mt-8">
        <ProductGrid products={data?.items ?? []} />
        {data && <Pagination page={data.page} pages={data.pages} hrefFor={(p) => `/category/${slug}?page=${p}`} />}
      </div>
    </div>
  );
}