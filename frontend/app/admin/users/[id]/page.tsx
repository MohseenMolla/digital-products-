'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, errMsg } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useFetch } from '@/hooks/useFetch';
import { Button } from '@/components/ui/Button';
import { DataTable, StatusBadge } from '@/components/ui/DataTable';
import { Input, Select } from '@/components/ui/Input';
import { ErrorState, PageLoader } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { formatBDT, formatDate } from '@/lib/format';

interface Detail {
  user: { id: string; name: string; email: string; phone: string; role: string; isActive: boolean };
  purchases: { id: string; product: { title: string } | null; accessStatus: string; accessGrantedAt: string; expiresAt: string | null }[];
  orders: { _id: string; orderNumber: string; amount: number; paymentStatus: string; createdAt: string }[];
}

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>(); const { user: me } = useAuth(); const toast = useToast();
  const { data, loading, error, reload } = useFetch<Detail>(`/admin/users/${id}`);
  const [form, setForm] = useState({ name: '', phone: '', role: 'USER', isActive: true });
  useEffect(() => { if (data) setForm({ name: data.user.name, phone: data.user.phone, role: data.user.role, isActive: data.user.isActive }); }, [data]);
  if (loading) return <PageLoader />;
  if (error || !data) return <ErrorState message={error} onRetry={reload} />;
  const superAdmin = me?.role === 'SUPER_ADMIN';
  async function save() {
    try { await api.put(`/admin/users/${id}`, { ...form, role: superAdmin ? form.role : undefined }); toast.success('User updated'); await reload(); } catch (e) { toast.error(errMsg(e)); }
  }
  async function act(pid: string, kind: 'revoke' | 'restore') {
    try { await api.post(`/admin/purchases/${pid}/${kind}`, kind === 'revoke' ? { reason: 'Revoked by admin' } : {}); toast.success(kind === 'revoke' ? 'Access revoked' : 'Access restored'); await reload(); } catch (e) { toast.error(errMsg(e)); }
  }
  return (
    <div className="space-y-6">
      <div><Link href="/admin/users" className="text-sm text-brand-700">← Users</Link><h1 className="text-2xl font-bold">{data.user.email}</h1></div>
      <div className="max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Select label="Role" disabled={!superAdmin} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option>USER</option><option>ADMIN</option><option>SUPER_ADMIN</option></Select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />Account enabled</label>
        <Button onClick={save}>Save</Button>
      </div>
      <div><h2 className="mb-2 font-semibold">Purchases & active products</h2>
        <DataTable rows={data.purchases} rowKey={(p) => p.id} empty="No purchases" columns={[
          { header: 'Product', cell: (p) => p.product?.title ?? '(deleted)' }, { header: 'Access', cell: (p) => <StatusBadge status={p.accessStatus} /> }, { header: 'Granted', cell: (p) => formatDate(p.accessGrantedAt) }, { header: 'Expires', cell: (p) => (p.expiresAt ? formatDate(p.expiresAt) : 'Lifetime') },
          { header: '', className: 'text-right', cell: (p) => p.accessStatus === 'REVOKED' ? <Button size="sm" variant="secondary" onClick={() => void act(p.id, 'restore')}>Restore</Button> : <Button size="sm" variant="danger" onClick={() => void act(p.id, 'revoke')}>Revoke</Button> },
        ]} /></div>
      <div><h2 className="mb-2 font-semibold">Order history</h2>
        <DataTable rows={data.orders} rowKey={(o) => o._id} empty="No orders" columns={[
          { header: 'Order', cell: (o) => <Link className="text-brand-700" href={`/admin/orders/${o._id}`}>{o.orderNumber}</Link> }, { header: 'Amount', cell: (o) => formatBDT(o.amount) }, { header: 'Status', cell: (o) => <StatusBadge status={o.paymentStatus} /> }, { header: 'Date', cell: (o) => formatDate(o.createdAt) },
        ]} /></div>
    </div>
  );
}
