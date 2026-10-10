'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Category } from '@/types';

export function Filter({ categories, hideCategory }: { categories: Category[]; hideCategory?: boolean }) {
  const router = useRouter(); const path = usePathname(); const sp = useSearchParams();
  const set = (k: string, v: string) => {
    const p = new URLSearchParams(sp.toString());
    if (v) p.set(k, v); else p.delete(k);
    p.delete('page');
    router.push(`${path}?${p.toString()}`);
  };
  const cls = 'h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none';
  return (
    <div className="flex flex-wrap gap-3">
      <select aria-label="Product type" className={cls} value={sp.get('productType') ?? ''} onChange={(e) => set('productType', e.target.value)}>
        <option value="">All types</option><option value="COURSE">Courses</option><option value="PREMIUM_APP">Premium Apps</option>
        <option value="PDF">PDF</option><option value="DIGITAL_PRODUCT">Digital Products</option><option value="SUBSCRIPTION">Subscriptions</option>
      </select>
      {!hideCategory && (
        <select aria-label="Category" className={cls} value={sp.get('category') ?? ''} onChange={(e) => set('category', e.target.value)}>
          <option value="">All categories</option>{categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
      )}
      <select aria-label="Sort" className={cls} value={sp.get('sort') ?? 'newest'} onChange={(e) => set('sort', e.target.value)}>
        <option value="newest">Newest</option><option value="popular">Popular</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option>
      </select>
    </div>
  );
}
