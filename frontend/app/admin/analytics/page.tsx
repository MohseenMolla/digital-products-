'use client';
import { useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { BarChart } from '@/components/MiniChart';
import { DataTable } from '@/components/ui/DataTable';
import { PagerButtons } from '@/components/ui/Pagination';
import { StatsCard } from '@/components/ui/StatsCard';
import { ErrorState, PageLoader } from '@/components/ui/States';
import { formatBDT, formatDateTime } from '@/lib/format';
import type { Paged } from '@/types';
import type { Stats } from '../page';

interface Log { _id: string; action: string; targetType: string; targetId: string; description: string; ip: string; createdAt: string; admin: { name: string; email: string } | null }

export default function Analytics() {
  const [page, setPage] = useState(1);
  const stats = useFetch<Stats>('/admin/stats'); const logs = useFetch<Paged<Log>>(`/admin/audit-logs?page=${page}`);
  if (stats.loading) return <PageLoader />;
  if (stats.error || !stats.data) return <ErrorState message={stats.error} onRetry={stats.reload} />;
  const t = stats.data.totals;
  return (
    <div className="space-y-8"><h1 className="text-2xl font-bold">Analytics</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard label="Revenue" value={formatBDT(t.totalRevenue)} /><StatsCard label="Orders" value={t.totalOrders} /><StatsCard label="Customers" value={t.totalUsers} /><StatsCard label="Conversion" value={`${t.conversion}%`} hint="Paid / all orders" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="mb-6 font-semibold">Revenue (last 30 days)</p><BarChart data={stats.data.revenueByDay.map((d) => ({ label: d.date, value: d.revenue }))} format={formatBDT} /></div>
      <div><h2 className="mb-2 font-semibold">Admin audit log</h2>
        {logs.loading ? <PageLoader /> : logs.error || !logs.data ? <ErrorState message={logs.error} onRetry={logs.reload} /> : (<>
          <DataTable rows={logs.data.items} rowKey={(l) => l._id} empty="No admin actions logged" columns={[
            { header: 'When', cell: (l) => formatDateTime(l.createdAt) }, { header: 'Admin', cell: (l) => l.admin?.email ?? '-' }, { header: 'Action', cell: (l) => <span className="font-mono text-xs font-semibold">{l.action}</span> },
            { header: 'Target', cell: (l) => `${l.targetType} ${l.targetId}` }, { header: 'Details', cell: (l) => l.description }, { header: 'IP', cell: (l) => l.ip },
          ]} />
          <PagerButtons page={logs.data.page} pages={logs.data.pages} onChange={setPage} /></>)}
      </div>
    </div>
  );
}
