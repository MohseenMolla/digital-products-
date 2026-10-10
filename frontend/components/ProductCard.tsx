'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types';

export function ProductCard({ product: p }: { product: Product }) {
  // Discount percentage calculation
  const discountPercent =
    p.discountPercent ??
    (p.comparePrice && p.price < p.comparePrice
      ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)
      : 0);

  return (
    <Link
      href={`/products/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-lg"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        {p.thumbnail ? (
          <Image
            src={p.thumbnail}
            alt={p.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
            No Image
          </div>
        )}

        {/* Top-Left Discount Badge */}
        {discountPercent > 0 && (
          <span className="absolute left-2 top-2 rounded bg-[#1bb200] px-1.5 py-0.5 text-xs font-bold text-white shadow-sm">
            -{discountPercent}%
          </span>
        )}
      </div>

      {/* Details Container */}
      <div className="flex flex-1 flex-col justify-between p-3 sm:p-4">
        {/* Title */}
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm sm:text-base font-semibold leading-snug text-slate-900 group-hover:text-black">
          {p.title}
        </h3>

        {/* Price Area */}
        <div className="mt-3 flex items-center gap-2">
          {p.comparePrice && p.comparePrice > p.price && (
            <span className="text-sm sm:text-base text-slate-400 line-through">
              {p.comparePrice}৳
            </span>
          )}
          <span className="text-lg sm:text-xl font-bold text-slate-900">
            {p.price}৳
          </span>
        </div>

        {/* Full-width Vibrant Green Buy Now Button */}
        <div className="mt-3 flex w-full items-center justify-center rounded-full bg-[#00c82c] py-2 sm:py-2.5 text-sm sm:text-base font-bold text-black sm:text-slate-950 shadow-sm transition hover:bg-[#00b027]">
          Buy Now
        </div>
      </div>
    </Link>
  );
}