'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import { DataTable, StatusBadge } from '@/components/ui/DataTable';
import { PagerButtons } from '@/components/ui/Pagination';
import { ErrorState, PageLoader } from '@/components/ui/States';
import { formatBDT, formatDate, cn } from '@/lib/format';
import type { OrderRow, Paged } from '@/types';

const TABS = ['ALL', 'PROCESSING', 'PAID', 'PENDING', 'FAILED', 'CANCELLED', 'REFUNDED'];
const LABEL: Record<string, string> = { PROCESSING: 'AWAITING VERIFICATION' };

export default function OrdersPage() {
  const [status, setStatus] = useState('ALL'); const [q, setQ] = useState(''); const [term, setTerm] = useState(''); const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch<Paged<OrderRow>>(`/admin/orders?status=${status}&q=${encodeURIComponent(term)}&page=${page}`);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>
      <div className="flex flex-wrap gap-2">{TABS.map((t) => <button key={t} onClick={() => { setStatus(t); setPage(1); }} className={cn('rounded-full border px-3 py-1.5 text-xs font-semibold', status === t ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white hover:bg-slate-50')}>{LABEL[t] ?? t}</button>)}</div>
      <form className="relative max-w-md" onSubmit={(e) => { e.preventDefault(); setTerm(q); setPage(1); }}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order ID, email, phone or transaction ID" className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm" />
      </form>
      {loading ? <PageLoader /> : error || !data ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <DataTable rows={data.items} rowKey={(o) => o._id} empty="No orders match your filters" columns={[
            { header: 'Order', cell: (o) => <Link className="font-medium text-brand-700" href={`/admin/orders/${o._id}`}>{o.orderNumber}</Link> },
            { header: 'Customer', cell: (o) => <div><p>{o.customerName}</p><p className="text-xs text-slate-500">{o.customerEmail}</p></div> },
            { header: 'Product', cell: (o) => o.productTitleSnapshot }, { header: 'Amount', cell: (o) => formatBDT(o.amount) },
            { header: 'Method', cell: (o) => o.paymentMethod ?? '-' }, { header: 'TrxID', cell: (o) => <span className="break-all font-mono text-xs">{o.transactionId ?? '-'}</span> },
            { header: 'Status', cell: (o) => <StatusBadge status={o.paymentStatus} /> }, { header: 'Date', cell: (o) => formatDate(o.createdAt) },
          ]} />
          <PagerButtons page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
