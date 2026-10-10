'use client';
import { useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { DataTable, StatusBadge } from '@/components/ui/DataTable';
import { PagerButtons } from '@/components/ui/Pagination';
import { ErrorState, PageLoader } from '@/components/ui/States';
import { formatBDT, formatDateTime } from '@/lib/format';
import type { Paged } from '@/types';

interface Tx { _id: string; transactionId: string; paymentMethod?: string; amount: number; fee: number; status: string; source: string; verifiedAt: string; order: { orderNumber: string; customerEmail: string } | null }

export default function AdminPayments() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch<Paged<Tx>>(`/admin/payments?page=${page}`);
  return (
    <div className="space-y-4"><h1 className="text-2xl font-bold">Payments</h1>
      {loading ? <PageLoader /> : error || !data ? <ErrorState message={error} onRetry={reload} /> : (<>
        <DataTable rows={data.items} rowKey={(t) => t._id} empty="No payment transactions yet" columns={[
          { header: 'Transaction', cell: (t) => <span className="break-all font-mono text-xs">{t.transactionId}</span> }, { header: 'Order', cell: (t) => t.order?.orderNumber ?? '-' }, { header: 'Customer', cell: (t) => t.order?.customerEmail ?? '-' },
          { header: 'Method', cell: (t) => t.paymentMethod ?? '-' }, { header: 'Amount', cell: (t) => formatBDT(t.amount) }, { header: 'Fee', cell: (t) => formatBDT(t.fee) },
          { header: 'Status', cell: (t) => <StatusBadge status={t.status} /> }, { header: 'Source', cell: (t) => t.source }, { header: 'Verified', cell: (t) => formatDateTime(t.verifiedAt) },
        ]} />
        <PagerButtons page={data.page} pages={data.pages} onChange={setPage} /></>)}
    </div>
  );
}
