import Link from 'next/link';
import { ArrowRight, BadgeCheck, CreditCard, Lock, MousePointerClick, ShieldCheck, Unlock, UserRound } from 'lucide-react';
import { ProductGrid } from '@/components/ProductGrid';
import { buttonClass } from '@/components/ui/Button';
import { getSettings } from '@/lib/settings';
import { sget } from '@/lib/server-api';
import type { Product } from '@/types';

interface Home { featured: Product[]; courses: Product[]; apps: Product[]; resources: Product[]; }

function Section({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section className="container-x mt-16">
      <div className="mb-6 flex items-end justify-between"><h2 className="text-2xl font-bold tracking-tight">{title}</h2><Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">View all<ArrowRight className="h-4 w-4" /></Link></div>
      {children}
    </section>
  );
}

const STEPS = [
  { icon: MousePointerClick, t: 'Choose product', d: 'Pick a course, guide or app.' },
  { icon: UserRound, t: 'Enter information', d: 'Name, email and phone only.' },
  { icon: CreditCard, t: 'Send money', d: 'bKash, Nagad or Rocket.' },
  { icon: BadgeCheck, t: 'Submit TrxID', d: 'Paste your transaction ID.' },
  { icon: Unlock, t: 'Get access', d: 'Your download page opens.' },
];

export default async function HomePage() {
  const [s, home] = await Promise.all([getSettings(), sget<Home>('/products/home', 60)]);
  const h = s.homepage;
  const d = home ?? { featured: [], courses: [], apps: [], resources: [] };
  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-brand-50 via-white to-white">
        {/* Added min-w-0 to prevent grid overflow on mobile */}
        <div className="container-x grid w-full min-w-0 items-center gap-10 py-16 md:py-24 lg:grid-cols-[1.2fr_1fr]">
          <div className="min-w-0">
            <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700 break-words"><ShieldCheck className="h-3.5 w-3.5 shrink-0" />bKash, Nagad & Rocket · instant access</span>
            <h1 className="mt-5 text-3xl font-extrabold leading-[1.1] tracking-tight text-brand-900 sm:text-5xl lg:text-6xl break-words">{h.heroTitle}</h1>
            <p className="mt-5 max-w-xl text-base sm:text-lg text-slate-600 break-words">{h.heroSubtitle}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/products" className={buttonClass('primary', 'lg')}>Explore Products</Link>
              <Link href="/products?productType=COURSE" className={buttonClass('secondary', 'lg')}>View Courses</Link>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="rounded-3xl border border-brand-100 bg-white p-6 shadow-xl shadow-brand-900/5">
              <p className="text-sm font-semibold text-slate-500">After you pay</p>
              <ul className="mt-4 space-y-3">
                {['Order created with a unique number', 'Send money via bKash, Nagad or Rocket', 'Submit your transaction ID', 'Your download page opens'].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-sm"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700"><BadgeCheck className="h-4 w-4" /></span>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {h.showFeatured && d.featured.length > 0 && <Section title="Featured products" href="/products?featured=true"><ProductGrid products={d.featured} /></Section>}
      {h.showCourses && d.courses.length > 0 && <Section title="Popular courses" href="/products?productType=COURSE"><ProductGrid products={d.courses} /></Section>}
      {h.showApps && d.apps.length > 0 && <Section title="Premium apps" href="/products?productType=PREMIUM_APP"><ProductGrid products={d.apps} /></Section>}
      {h.showResources && d.resources.length > 0 && <Section title="Latest resources" href="/products?productType=PDF"><ProductGrid products={d.resources} /></Section>}
      {!home && <p className="container-x mt-16 text-center text-slate-500">Products could not be loaded right now. Please refresh in a moment.</p>}

      {h.whyChoose.length > 0 && (
        <section className="container-x mt-20">
          <h2 className="text-2xl font-bold tracking-tight">Why choose us</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {h.whyChoose.map((w) => <div key={w.title} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="font-semibold">{w.title}</p><p className="mt-1 text-sm text-slate-600">{w.text}</p></div>)}
          </div>
        </section>
      )}

      <section className="container-x mt-20">
        <div className="flex flex-col items-start gap-4 rounded-3xl bg-brand-900 p-8 text-white sm:flex-row sm:items-center sm:p-10">
          <Lock className="h-10 w-10 shrink-0 text-accent" />
          <div><h2 className="text-xl font-bold">Pay with bKash, Nagad or Rocket</h2><p className="mt-1 text-sm text-brand-100">Send money to our number, submit your transaction ID, and your download page opens. Each transaction ID can only be used once.</p></div>
        </div>
      </section>

      <section className="container-x mt-20">
        <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((st, i) => (
            <li key={st.t} className="rounded-2xl border border-slate-200 p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><st.icon className="h-5 w-5" /></span>
              <p className="mt-3 text-xs font-bold text-brand-600">STEP {i + 1}</p><p className="font-semibold">{st.t}</p><p className="mt-1 text-sm text-slate-600">{st.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {h.faqs.length > 0 && (
        <section className="container-x mt-20 max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight">Frequently asked questions</h2>
          <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200">
            {h.faqs.map((f) => (
              <details key={f.question} className="group p-5"><summary className="cursor-pointer list-none font-semibold marker:hidden">{f.question}</summary><p className="mt-2 text-sm text-slate-600">{f.answer}</p></details>
            ))}
          </div>
        </section>
      )}
    </>
  );
}