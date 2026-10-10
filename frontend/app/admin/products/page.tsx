'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api, errMsg } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import { buttonClass } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, StatusBadge } from '@/components/ui/DataTable';
import { PagerButtons } from '@/components/ui/Pagination';
import { ErrorState, PageLoader } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { formatBDT, TYPE_LABEL } from '@/lib/format';
import type { Paged } from '@/types';

interface Row { id: string; title: string; price: number; productType: string; status: string; featured: boolean }

export default function AdminProducts() {
  const toast = useToast(); const [page, setPage] = useState(1); const [q, setQ] = useState(''); const [del, setDel] = useState<Row | null>(null);
  const { data, loading, error, reload } = useFetch<Paged<Row>>(`/admin/products?page=${page}&q=${encodeURIComponent(q)}`);
  async function toggle(r: Row, patch: 'status' | 'featured') {
    try {
      const full = (await api.get(`/admin/products/${r.id}`)).data.data;
      const body = { ...full, category: full.category || null, appCredentials: { ...full.appCredentials, expiresAt: full.appCredentials?.expiresAt || null } };
      if (patch === 'status') body.status = r.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'; else body.featured = !r.featured;
      await api.put(`/admin/products/${r.id}`, body); await reload();
    } catch (e) { toast.error(errMsg(e)); }
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">Products</h1><Link href="/admin/products/new" className={buttonClass('primary')}><Plus className="h-4 w-4" />New product</Link></div>
      <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search products..." className="h-10 w-full max-w-sm rounded-lg border border-slate-300 px-3 text-sm" />
      {loading ? <PageLoader /> : error || !data ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <DataTable rows={data.items} rowKey={(r) => r.id} empty="No products yet" columns={[
            { header: 'Title', cell: (r) => <span className="font-medium">{r.title}</span> }, { header: 'Type', cell: (r) => TYPE_LABEL[r.productType] }, { header: 'Price', cell: (r) => formatBDT(r.price) },
            { header: 'Status', cell: (r) => <button onClick={() => void toggle(r, 'status')} title="Toggle publish"><StatusBadge status={r.status} /></button> },
            { header: 'Featured', cell: (r) => <input type="checkbox" checked={r.featured} onChange={() => void toggle(r, 'featured')} className="h-4 w-4 accent-brand-600" aria-label="Featured" /> },
            { header: '', className: 'text-right', cell: (r) => <div className="flex justify-end gap-1"><Link href={`/admin/products/${r.id}`} className="rounded p-2 hover:bg-slate-100" aria-label="Edit"><Pencil className="h-4 w-4" /></Link><button className="rounded p-2 text-red-600 hover:bg-red-50" aria-label="Delete" onClick={() => setDel(r)}><Trash2 className="h-4 w-4" /></button></div> },
          ]} />
          <PagerButtons page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}
      <ConfirmDialog open={!!del} danger title="Delete product" message={`Delete "${del?.title}"? This cannot be undone. Products with paid orders must be unpublished instead.`} confirmLabel="Delete" onClose={() => setDel(null)}
        onConfirm={async () => { try { await api.delete(`/admin/products/${del!.id}`); toast.success('Product deleted'); await reload(); } catch (e) { toast.error(errMsg(e)); } }} />
    </div>
  );
}
