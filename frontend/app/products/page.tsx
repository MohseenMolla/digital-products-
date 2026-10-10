import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Filter } from '@/components/Filter';
import { Pagination } from '@/components/ui/Pagination';
import { ProductGrid } from '@/components/ProductGrid';
import { SearchBar } from '@/components/SearchBar';
import { ErrorState } from '@/components/ui/States';
import { sget } from '@/lib/server-api';
import type { Category, Paged, Product } from '@/types';

export const metadata: Metadata = { title: 'All Products', description: 'Browse courses, PDFs, premium apps and digital products.', alternates: { canonical: '/products' } };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const k of ['q', 'category', 'productType', 'sort', 'page', 'featured']) if (sp[k]) qs.set(k, sp[k]!);
  qs.set('limit', '12');
  const [data, cats] = await Promise.all([sget<Paged<Product>>(`/products?${qs}`, 30), sget<Category[]>('/categories', 120)]);
  const hrefFor = (p: number) => { const n = new URLSearchParams(qs); n.delete('limit'); n.set('page', String(p)); return `/products?${n}`; };
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-bold tracking-tight">{sp.q ? `Results for "${sp.q}"` : 'All Products'}</h1>
      <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Suspense><Filter categories={cats ?? []} /></Suspense>
        <SearchBar initial={sp.q ?? ''} className="w-full md:w-72" />
      </div>
      <div className="mt-8">
        {!data ? <ErrorState message="We couldn't load products. Please try again shortly." /> : (
          <>
            <p className="mb-4 text-sm text-slate-500">{data.total} product{data.total === 1 ? '' : 's'}</p>
            <ProductGrid products={data.items} />
            <Pagination page={data.page} pages={data.pages} hrefFor={hrefFor} />
          </>
        )}
      </div>
    </div>
  );
}
