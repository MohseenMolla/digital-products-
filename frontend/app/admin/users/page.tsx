'use client';
import Link from 'next/link';
import { useState } from 'react';
import { api, errMsg } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useFetch } from '@/hooks/useFetch';
import { Button } from '@/components/ui/Button';
import { DataTable, StatusBadge } from '@/components/ui/DataTable';
import { PagerButtons } from '@/components/ui/Pagination';
import { ErrorState, PageLoader } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/format';
import type { Paged } from '@/types';

interface U { id: string; name: string; email: string; phone: string; role: string; isActive: boolean; createdAt: string }

export default function AdminUsers() {
  const { user: me } = useAuth(); const toast = useToast();
  const [page, setPage] = useState(1); const [q, setQ] = useState('');
  const { data, loading, error, reload } = useFetch<Paged<U>>(`/admin/users?page=${page}&q=${encodeURIComponent(q)}`);
  async function toggle(u: U) {
    try { await api.put(`/admin/users/${u.id}`, { name: u.name, phone: u.phone, isActive: !u.isActive }); toast.success(u.isActive ? 'User disabled' : 'User enabled'); await reload(); } catch (e) { toast.error(errMsg(e)); }
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Users</h1>
      <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name, email or phone" className="h-10 w-full max-w-sm rounded-lg border border-slate-300 px-3 text-sm" />
      {loading ? <PageLoader /> : error || !data ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <DataTable rows={data.items} rowKey={(u) => u.id} empty="No users found" columns={[
            { header: 'Name', cell: (u) => <Link className="font-medium text-brand-700" href={`/admin/users/${u.id}`}>{u.name}</Link> }, { header: 'Email', cell: (u) => u.email }, { header: 'Phone', cell: (u) => u.phone },
            { header: 'Role', cell: (u) => u.role }, { header: 'Status', cell: (u) => <StatusBadge status={u.isActive ? 'ACTIVE' : 'REVOKED'} /> }, { header: 'Joined', cell: (u) => formatDate(u.createdAt) },
            { header: '', className: 'text-right', cell: (u) => <Button size="sm" variant="secondary" disabled={u.id === me?.id} onClick={() => void toggle(u)}>{u.isActive ? 'Disable' : 'Enable'}</Button> },
          ]} />
          <PagerButtons page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
