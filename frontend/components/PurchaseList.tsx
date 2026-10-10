'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import { buttonClass } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/DataTable';
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/States';
import { formatBDT, formatDate, TYPE_LABEL } from '@/lib/format';
import type { ProductType, PurchaseItem } from '@/types';

export function PurchaseList({ types, emptyText, mode = 'cards' }: { types?: ProductType[]; emptyText: string; mode?: 'cards' | 'table' }) {
  const { data, loading, error, reload } = useFetch<PurchaseItem[]>('/purchases/mine');
  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const list = (data ?? []).filter((p) => !types || types.includes(p.productType));
  if (!list.length) return <EmptyState title={emptyText} action={<Link href="/products" className={buttonClass('primary')}>Browse products</Link>} />;

  if (mode === 'table') {
    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Purchased</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Access</th><th className="px-4 py-3" /></tr></thead>
          <tbody className="divide-y">
            {list.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3"><p className="font-medium">{p.title}</p><p className="text-xs text-slate-500">{p.orderNumber} · {p.amount !== undefined ? formatBDT(p.amount) : ''}</p></td>
                <td className="px-4 py-3">{formatDate(p.purchasedAt)}</td>
                <td className="px-4 py-3"><StatusBadge status={p.paymentStatus ?? 'PAID'} /></td>
                <td className="px-4 py-3"><StatusBadge status={p.accessStatus} /></td>
                <td className="px-4 py-3 text-right">{p.accessStatus === 'ACTIVE' ? <Link href={`/dashboard/products/${p.productId}`} className={buttonClass('primary', 'sm')}>Access</Link> : <span className="text-xs text-slate-400">Unavailable</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {list.map((p) => (
        <div key={p.id} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-brand-50">{p.thumbnail ? <Image src={p.thumbnail} alt="" fill sizes="112px" className="object-cover" /> : <Package className="absolute inset-0 m-auto h-6 w-6 text-brand-500/60" />}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{p.title}</p>
            <p className="text-xs text-slate-500">{TYPE_LABEL[p.productType]} · {p.expiresAt ? `Expires ${formatDate(p.expiresAt)}` : 'Lifetime'}</p>
            <div className="mt-2 flex items-center gap-2"><StatusBadge status={p.accessStatus} />
              {p.accessStatus === 'ACTIVE' ? <Link href={p.productType === 'COURSE' ? `/dashboard/products/${p.productId}` : `/dashboard/products/${p.productId}`} className={buttonClass('primary', 'sm')}>Open</Link> : null}
            </div>
            {p.accessStatus === 'REVOKED' && <p className="mt-1 text-xs text-red-600">Product access has been revoked.</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
