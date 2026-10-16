import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  BookOpen,
  Check,
  Lock,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { BuyBox } from '@/components/BuyBox';
import { PriceDisplay } from '@/components/PriceDisplay';
import { ProductGrid } from '@/components/ProductGrid';
import { ProductViewTracker } from '@/components/ProductViewTracker';
import { sget } from '@/lib/server-api';
import { TYPE_LABEL } from '@/lib/format';
import type { Product, Paged } from '@/types';

type Props = {
  params: Promise<{ slug: string }>;
};

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await sget<Product>(`/products/${slug}`, 60);

  if (!p) return { title: 'Product not found' };

  const url = `/products/${p.slug}`;

  return {
    title: p.title,
    description: p.shortDescription || p.description.slice(0, 160),
    alternates: { canonical: url },
    openGraph: {
      title: p.title,
      description: p.shortDescription,
      url: `${SITE}${url}`,
      type: 'website',
      images: p.thumbnail ? [{ url: p.thumbnail }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: p.title,
      description: p.shortDescription,
      images: p.thumbnail ? [p.thumbnail] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  const p = await sget<Product>(`/products/${slug}`, 60);

  if (!p) notFound();

  const allProductsData = await sget<Paged<Product>>(
    '/products?limit=5',
    60
  );

  const relatedProducts =
    allProductsData?.items
      .filter((item) => item.slug !== p.slug)
      .slice(0, 4) ?? [];

  const lessons = p.courseModules.reduce(
    (total, module) => total + module.lessons.length,
    0
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    description: p.shortDescription,
    image: p.thumbnail || undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BDT',
      price: p.price,
      availability:
        p.stockStatus === 'IN_STOCK'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  };

  return (
    // Added bottom padding on mobile so the content isn't hidden behind the fixed buy bar
    <article className="container-x py-5 pb-32 md:py-10 lg:pb-12">
      <ProductViewTracker product={p} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      {/* Professional Buy Now animation styles - No Spinner, Only Bouncing */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .product-buybox > div > a:first-child,
            .product-buybox > div > button,
            .product-buybox-mobile > div > a:first-child,
            .product-buybox-mobile > div > button {
              position: relative;
              display: flex !important;
              align-items: center;
              justify-content: center;
              gap: 12px;
              width: 100%;
              min-height: 64px;
              padding: 15px 22px;
              overflow: visible;
              border: none !important;
              border-radius: 9999px !important;
              background: linear-gradient(105deg, #0ba360 0%, #3cba54 50%, #159f5c 100%) !important;
              color: #fff !important;
              font-size: 28px;
              font-weight: 800;
              line-height: 1.2;
              text-align: center;
              text-decoration: none !important;
              box-shadow: 0 8px 24px rgba(11, 163, 96, 0.35);
              transform-origin: center;
              animation: productBuyNowBounce 1.5s ease-in-out infinite;
              transition: transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease;
              -webkit-tap-highlight-color: transparent;
            }

            .product-buybox > div > a:first-child:hover,
            .product-buybox > div > button:hover,
            .product-buybox-mobile > div > a:first-child:hover,
            .product-buybox-mobile > div > button:hover {
              filter: brightness(1.05);
              transform: scale(1.02) translateY(-2px);
              box-shadow: 0 12px 30px rgba(11, 163, 96, 0.45);
              animation-play-state: paused;
            }

            .product-buybox > div > a:first-child:active,
            .product-buybox > div > button:active,
            .product-buybox-mobile > div > a:first-child:active,
            .product-buybox-mobile > div > button:active {
              transform: scale(0.97);
              box-shadow: 0 4px 12px rgba(11, 163, 96, 0.25);
            }

            /* Hide Add to Cart if BuyBox renders multiple buttons */
            .product-buybox > div > button:not(:first-child),
            .product-buybox-mobile > div > button:not(:first-child) {
              display: none !important;
            }

            @keyframes productBuyNowBounce {
              0%, 100% {
                transform: translateY(0);
              }
              50% {
                transform: translateY(-6px);
              }
            }

            @media (max-width: 480px) {
              .product-buybox > div > a:first-child,
              .product-buybox > div > button,
              .product-buybox-mobile > div > a:first-child,
              .product-buybox-mobile > div > button {
                min-height: 56px;
                font-size: 24px;
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .product-buybox > div > a:first-child,
              .product-buybox > div > button,
              .product-buybox-mobile > div > a:first-child,
              .product-buybox-mobile > div > button {
                animation: none;
              }
            }
          `,
        }}
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
        {/* Product image and gallery */}
        <div>
          {/* Uncropped Full Image Wrapper */}
          <div className="relative w-full overflow-hidden rounded-[24px] border-[3px] border-emerald-400 bg-slate-950 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
            {p.thumbnail && (
              <Image
                src={p.thumbnail}
                alt={p.title}
                width={1200}
                height={1200}
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="h-auto w-full object-contain"
              />
            )}
          </div>

          {p.images.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {p.images.slice(0, 4).map((src) => (
                <div
                  key={src}
                  className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-sm"
                >
                  <Image
                    src={src}
                    alt={p.title}
                    fill
                    sizes="(max-width: 768px) 25vw, 15vw"
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Purchase and product information */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:shadow-md">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
              <BookOpen className="h-4 w-4" />
              {TYPE_LABEL[p.productType]}
              {p.category ? ` · ${p.category.name}` : ''}
            </div>

            <h1 className="mt-3 text-2xl font-bold leading-tight text-slate-900 md:text-3xl">
              {p.title}
            </h1>

            <div className="mt-3 flex items-center gap-1 text-sm font-medium text-slate-500">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i <= Math.round(p.ratingAvg)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-slate-100 text-slate-200'
                  }`}
                />
              ))}

              <span className="ml-2">
                {p.ratingCount
                  ? `${p.ratingAvg.toFixed(1)} (${p.ratingCount} reviews)`
                  : 'No ratings yet'}
              </span>
            </div>

            <p className="mt-4 text-base leading-relaxed text-slate-600">
              {p.shortDescription}
            </p>

            <div className="mt-6 rounded-xl bg-slate-50 p-4 border border-slate-100">
              <PriceDisplay
                price={p.price}
                comparePrice={p.comparePrice}
                discountPercent={p.discountPercent}
                large
              />
            </div>

            {/* Desktop BuyBox - Hidden on mobile, visible on lg screens */}
            <div className="product-buybox mt-6 hidden lg:block">
              <BuyBox product={p} />
            </div>

            {/* Payment reassurance */}
            <div className="mt-5 flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-900 border border-emerald-100">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <span>
                <strong>100% Safe & Secure Checkout.</strong> Pay with bKash, Nagad or Rocket. No account needed.
              </span>
            </div>

            {/* About product */}
            <div className="mt-8 border-t border-slate-100 pt-6">
              <h2 className="text-lg font-bold text-slate-900">
                About this product
              </h2>

              <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {p.description || p.shortDescription}
              </div>
            </div>

            {/* Features */}
            {p.features.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-6">
                <h2 className="text-lg font-bold text-slate-900">
                  Features
                </h2>

                <ul className="mt-4 grid gap-3">
                  {p.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-slate-700"
                    >
                      <div className="mt-0.5 rounded-full bg-emerald-100 p-1">
                        <Check className="h-3 w-3 shrink-0 text-emerald-600" />
                      </div>
                      <span className="font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* What you get */}
            {p.whatYouGet.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-6">
                <h2 className="text-lg font-bold text-slate-900">
                  What you get
                </h2>

                <ul className="mt-4 space-y-3">
                  {p.whatYouGet.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm text-slate-700"
                    >
                      <div className="mt-0.5 rounded-full bg-emerald-100 p-1">
                        <Check className="h-3 w-3 shrink-0 text-emerald-600" />
                      </div>
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Course content */}
      {p.courseModules.length > 0 && (
        <section className="mt-12 lg:w-2/3">
          <h2 className="text-2xl font-bold text-slate-900">Course Content</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {p.courseModules.length} modules · {lessons} lessons
          </p>

          <div className="mt-5 space-y-3">
            {p.courseModules.map((module) => (
              <details
                key={module.id}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300"
                open
              >
                <summary className="cursor-pointer font-bold text-slate-900 outline-none">
                  {module.title}
                </summary>

                <ul className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  {module.lessons.map((lesson) => (
                    <li
                      key={lesson.id}
                      className="flex items-center gap-3 text-sm text-slate-600 hover:text-emerald-600 transition-colors"
                    >
                      <Lock className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-emerald-500" />
                      <span className="flex-1 font-medium">{lesson.title}</span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                        {lesson.duration}
                      </span>
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
        <section className="mt-12 lg:w-2/3">
          <h2 className="text-2xl font-bold text-slate-900">FAQ</h2>

          <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
            {p.faqs.map((faq) => (
              <details key={faq.question} className="group p-5">
                <summary className="cursor-pointer font-semibold text-slate-900 outline-none">
                  {faq.question}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 border-t border-slate-200 pt-12">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            You may also like
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Explore similar products and resources
          </p>

          <div className="mt-6">
            <ProductGrid products={relatedProducts} />
          </div>
        </section>
      )}

      {/* MOBILE STICKY BOTTOM BUY BAR */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md shadow-[0_-8px_30px_rgba(0,0,0,0.12)] lg:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto flex max-w-md flex-col items-center gap-1">
          {/* Optional: Show small price above button on mobile for better UX */}
          <div className="mb-1 text-center text-sm font-bold text-slate-900">
            Total Price: <span className="text-emerald-600">৳{p.price}</span>
          </div>
          
          <div className="w-full product-buybox-mobile">
            <BuyBox product={p} />
          </div>
          
          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-500">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            Secure checkout with bKash, Nagad, or Rocket
          </p>
        </div>
      </div>
    </article>
  );
}