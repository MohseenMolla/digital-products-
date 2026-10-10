'use client';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/States';
import { formatBDT } from '@/lib/format';

export default function CartPage() {
  const { items, remove } = useCart();
  return (
    <div className="container-x max-w-3xl py-10">
      <h1 className="text-3xl font-bold tracking-tight">Your cart</h1>
      <p className="mt-1 text-sm text-slate-500">Each product is purchased in its own secure checkout.</p>
      <div className="mt-6 space-y-3">
        {items.length === 0 && <EmptyState title="Your cart is empty" action={<Link href="/products" className={buttonClass('primary')}>Browse products</Link>} />}
        {items.map((i) => (
          <div key={i.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-4">
            <div className="min-w-0 flex-1"><Link href={`/products/${i.slug}`} className="font-semibold hover:text-brand-700">{i.title}</Link><p className="text-sm text-slate-500">{formatBDT(i.price)}</p></div>
            <Link href={`/checkout/${i.id}`} className={buttonClass('primary', 'sm')}>Checkout</Link>
            <button onClick={() => remove(i.id)} aria-label="Remove" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
