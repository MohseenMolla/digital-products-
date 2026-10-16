import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import type { Settings } from '@/types';

export function Footer({ s }: { s: Settings }) {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-sand">
      <div className="container-x grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="text-lg font-extrabold text-brand-900">{s.siteName}</p>
          <p className="mt-2 max-w-sm text-sm text-slate-600">{s.footerText || s.tagline}</p>
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600"><ShieldCheck className="h-4 w-4 text-brand-600" />Pay with bKash, Nagad or Rocket</p>
        </div>
        <div>
          <p className="text-sm font-semibold">Shop</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link href="/products?productType=COURSE">Courses</Link></li><li><Link href="/products?productType=PREMIUM_APP">Premium Apps</Link></li>
            <li><Link href="/products?productType=PDF">PDF & Resources</Link></li><li><Link href="/products">All Products</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Contact</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {s.contactEmail && <li><a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a></li>}
            {s.phone && <li>{s.phone}</li>}
            {s.whatsapp && <li><a href={`https://wa.me/${s.whatsapp.replace(/\D/g, '')}`} rel="noopener noreferrer" target="_blank">WhatsApp</a></li>}
            {s.facebook && <li><a href={s.facebook} rel="noopener noreferrer" target="_blank">Facebook</a></li>}
            {s.telegram && <li><a href={s.telegram} rel="noopener noreferrer" target="_blank">Telegram</a></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 py-4 text-xs text-slate-500">
        <div className="container-x flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p>© {new Date().getFullYear()} {s.siteName}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-brand-700 transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link href="/cookie-policy" className="hover:text-brand-700 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
