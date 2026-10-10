'use client';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api, errMsg } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, StatusBadge } from '@/components/ui/DataTable';
import { Input, Select } from '@/components/ui/Input';
import { ErrorState, PageLoader } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/format';

interface C { _id: string; code: string; type: 'PERCENTAGE' | 'FIXED'; value: number; minimumAmount: number; maximumDiscount: number; usageLimit: number; usedCount: number; expiresAt: string | null; active: boolean }
const blank = { code: '', type: 'PERCENTAGE', value: 10, minimumAmount: 0, maximumDiscount: 0, usageLimit: 0, expiresAt: '', active: true };

export default function AdminCoupons() {
  const toast = useToast(); const { data, loading, error, reload } = useFetch<C[]>('/coupons');
  const [f, setF] = useState(blank); const [busy, setBusy] = useState(false); const [del, setDel] = useState<C | null>(null);
  async function add(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try { await api.post('/coupons', { ...f, expiresAt: f.expiresAt || null }); toast.success('Coupon created'); setF(blank); await reload(); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  }
  async function toggle(c: C) {
    try { await api.put(`/coupons/${c._id}`, { ...c, active: !c.active }); await reload(); } catch (e) { toast.error(errMsg(e)); }
  }
  return (
    <div className="space-y-4"><h1 className="text-2xl font-bold">Coupons</h1>
      <form onSubmit={add} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-3 lg:grid-cols-4">
        <Input label="Code" required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} />
        <Select label="Type" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed (৳)</option></Select>
        <Input label="Value" type="number" min={0} value={f.value} onChange={(e) => setF({ ...f, value: Number(e.target.value) })} />
        <Input label="Minimum amount" type="number" min={0} value={f.minimumAmount} onChange={(e) => setF({ ...f, minimumAmount: Number(e.target.value) })} />
        <Input label="Max discount (0 = none)" type="number" min={0} value={f.maximumDiscount} onChange={(e) => setF({ ...f, maximumDiscount: Number(e.target.value) })} />
        <Input label="Usage limit (0 = none)" type="number" min={0} value={f.usageLimit} onChange={(e) => setF({ ...f, usageLimit: Number(e.target.value) })} />
        <Input label="Expires" type="date" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} />
        <div className="flex items-end"><Button type="submit" className="h-11 w-full" loading={busy}>Create coupon</Button></div>
      </form>
      {loading ? <PageLoader /> : error || !data ? <ErrorState message={error} onRetry={reload} /> : (
        <DataTable rows={data} rowKey={(c) => c._id} empty="No coupons yet" columns={[
          { header: 'Code', cell: (c) => <span className="font-mono font-semibold">{c.code}</span> }, { header: 'Discount', cell: (c) => (c.type === 'PERCENTAGE' ? `${c.value}%` : `৳${c.value}`) },
          { header: 'Used', cell: (c) => `${c.usedCount}${c.usageLimit ? ` / ${c.usageLimit}` : ''}` }, { header: 'Expires', cell: (c) => (c.expiresAt ? formatDate(c.expiresAt) : 'Never') },
          { header: 'Status', cell: (c) => <button onClick={() => void toggle(c)}><StatusBadge status={c.active ? 'ACTIVE' : 'REVOKED'} /></button> },
          { header: '', className: 'text-right', cell: (c) => <button aria-label="Delete" className="rounded p-2 text-red-600 hover:bg-red-50" onClick={() => setDel(c)}><Trash2 className="h-4 w-4" /></button> },
        ]} />
      )}
      <ConfirmDialog open={!!del} danger title="Delete coupon" message={`Delete ${del?.code}?`} confirmLabel="Delete" onClose={() => setDel(null)}
        onConfirm={async () => { try { await api.delete(`/coupons/${del!._id}`); await reload(); } catch (e) { toast.error(errMsg(e)); } }} />
    </div>
  );
}
