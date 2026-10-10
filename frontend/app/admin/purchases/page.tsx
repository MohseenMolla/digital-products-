'use client';
import { useState } from 'react';
import { api, errMsg } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import { Button } from '@/components/ui/Button';
import { DataTable, StatusBadge } from '@/components/ui/DataTable';
import { PagerButtons } from '@/components/ui/Pagination';
import { ErrorState, PageLoader } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/format';
import type { Paged } from '@/types';

interface P { id: string; user: { name: string; email: string } | null; product: { title: string } | null; order: { orderNumber: string } | null; accessStatus: string; accessGrantedAt: string; expiresAt: string | null; downloadCount: number }

export default function AdminPurchases() {
  const toast = useToast(); const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch<Paged<P>>(`/admin/purchases?page=${page}`);
  async function act(id: string, kind: 'revoke' | 'restore') {
    try { await api.post(`/admin/purchases/${id}/${kind}`, kind === 'revoke' ? { reason: 'Revoked by admin' } : {}); toast.success('Updated'); await reload(); } catch (e) { toast.error(errMsg(e)); }
  }
  return (
    <div className="space-y-4"><h1 className="text-2xl font-bold">Purchases</h1>
      {loading ? <PageLoader /> : error || !data ? <ErrorState message={error} onRetry={reload} /> : (<>
        <DataTable rows={data.items} rowKey={(p) => p.id} empty="No purchases yet" columns={[
          { header: 'User', cell: (p) => <div><p>{p.user?.name}</p><p className="text-xs text-slate-500">{p.user?.email}</p></div> }, { header: 'Product', cell: (p) => p.product?.title ?? '(deleted)' }, { header: 'Order', cell: (p) => p.order?.orderNumber ?? '-' },
          { header: 'Access', cell: (p) => <StatusBadge status={p.accessStatus} /> }, { header: 'Granted', cell: (p) => formatDate(p.accessGrantedAt) }, { header: 'Expires', cell: (p) => (p.expiresAt ? formatDate(p.expiresAt) : 'Lifetime') }, { header: 'Downloads', cell: (p) => p.downloadCount },
          { header: '', className: 'text-right', cell: (p) => p.accessStatus === 'REVOKED' ? <Button size="sm" variant="secondary" onClick={() => void act(p.id, 'restore')}>Restore</Button> : <Button size="sm" variant="danger" onClick={() => void act(p.id, 'revoke')}>Revoke</Button> },
        ]} />
        <PagerButtons page={data.page} pages={data.pages} onChange={setPage} /></>)}
    </div>
  );
}
