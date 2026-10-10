import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { BookOpen, Check, Lock, ShieldCheck, Star } from 'lucide-react';
import { BuyBox } from '@/components/BuyBox';
import { PriceDisplay } from '@/components/PriceDisplay';
import { ProductGrid } from '@/components/ProductGrid';
import { sget } from '@/lib/server-api';
import { TYPE_LABEL } from '@/lib/format';
import type { Product, Paged } from '@/types';

type Props = { params: Promise<{ slug: string }> };
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await sget<Product>(`/products/${slug}`, 60);
  if (!p) return { title: 'Product not found' };
  const url = `/products/${p.slug}`;
  return {
    title: p.title, description: p.shortDescription || p.description.slice(0, 160), alternates: { canonical: url },
    openGraph: { title: p.title, description: p.shortDescription, url: `${SITE}${url}`, type: 'website', images: p.thumbnail ? [{ url: p.thumbnail }] : undefined },
    twitter: { card: 'summary_large_image', title: p.title, description: p.shortDescription, images: p.thumbnail ? [p.thumbnail] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  
  const p = await sget<Product>(`/products/${slug}`, 60);
  if (!p) notFound();

  // Related / Suggestion products fetch (Fallback to general products if specific type fails)
  const allProductsData = await sget<Paged<Product>>(`/products?limit=5`, 60);
  const relatedProducts = allProductsData?.items.filter(item => item.slug !== p.slug).slice(0, 4) || [];

  const lessons = p.courseModules.reduce((n, m) => n + m.lessons.length, 0);
  const jsonLd = { '@context': 'https://schema.org', '@type': 'Product', name: p.title, description: p.shortDescription, image: p.thumbnail || undefined, offers: { '@type': 'Offer', priceCurrency: 'BDT', price: p.price, availability: p.stockStatus === 'IN_STOCK' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } };

  return (
    <article className="container-x py-8 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        
        {/* Left Column: Image & Details */}
        <div>
          {/* মূল থাম্বনেইল ইমেজ */}
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
            {p.thumbnail && <Image src={p.thumbnail} alt={p.title} fill priority sizes="(max-width:1024px) 100vw, 60vw" className="object-contain" />}
          </div>
          
          {/* গ্যালারি ইমেজ */}
          {p.images.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {p.images.slice(0, 4).map((src) => (
                <div key={src} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
                  <Image src={src} alt="" fill sizes="15vw" className="object-contain" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Buy Box & Details shifted below buy actions */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-700">
              <BookOpen className="h-4 w-4" />{TYPE_LABEL[p.productType]}{p.category ? ` · ${p.category.name}` : ''}
            </div>
            <h1 className="mt-2 text-2xl font-bold leading-tight">{p.title}</h1>
            <div className="mt-2 flex items-center gap-1 text-sm text-slate-500">
              {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`h-4 w-4 ${i <= Math.round(p.ratingAvg) ? 'fill-accent text-accent' : 'text-slate-300'}`} />)}
              <span className="ml-1">{p.ratingCount ? `${p.ratingAvg.toFixed(1)} (${p.ratingCount})` : 'No ratings yet'}</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">{p.shortDescription}</p>
            <div className="mt-4"><PriceDisplay price={p.price} comparePrice={p.comparePrice} discountPercent={p.discountPercent} large /></div>
            
            {/* Buy Box & Action Buttons */}
            <BuyBox product={p} />
            
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-brand-50 p-3 text-xs text-brand-900">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />Pay with bKash, Nagad or Rocket. No account needed: submit your transaction ID and get your download page.
            </p>

            {/* ABOUT THIS PRODUCT (Buy Now এর নিচে স্থানান্তরিত) */}
            <div className="mt-8 border-t border-slate-100 pt-6">
              <h2 className="text-lg font-bold text-slate-900">About this product</h2>
              <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {p.description || p.shortDescription}
              </div>
            </div>

            {/* Features */}
            {p.features.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-6">
                <h2 className="text-lg font-bold text-slate-900">Features</h2>
                <ul className="mt-3 grid gap-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* What you get */}
            {p.whatYouGet.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-6">
                <h2 className="text-lg font-bold text-slate-900">What you get</h2>
                <ul className="mt-3 space-y-2">
                  {p.whatYouGet.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Course Content & Modules (Full Width Bottom) */}
      {p.courseModules.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold">Course content</h2>
          <p className="mt-1 text-sm text-slate-500">{p.courseModules.length} modules · {lessons} lessons</p>
          <div className="mt-3 space-y-3">
            {p.courseModules.map((m) => (
              <details key={m.id} className="rounded-xl border border-slate-200 p-4" open>
                <summary className="cursor-pointer font-semibold">{m.title}</summary>
                <ul className="mt-3 space-y-2">
                  {m.lessons.map((l) => (
                    <li key={l.id} className="flex items-center gap-2 text-sm text-slate-600">
                      <Lock className="h-3.5 w-3.5 text-slate-400" /><span className="flex-1">{l.title}</span><span className="text-xs text-slate-400">{l.duration}</span>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* FAQs */}
      {p.faqs.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold">FAQ</h2>
          <div className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200">
            {p.faqs.map((f) => (
              <details key={f.question} className="p-4">
                <summary className="cursor-pointer font-medium">{f.question}</summary>
                <p className="mt-2 text-sm text-slate-600">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Related Products / Suggestions Section */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 border-t border-slate-200 pt-12">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">You may also like</h2>
          <p className="mt-1 text-sm text-slate-500">Explore similar products and resources</p>
          <div className="mt-6">
            <ProductGrid products={relatedProducts} />
          </div>
        </section>
      )}
    </article>
  );
}