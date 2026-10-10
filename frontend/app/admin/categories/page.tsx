'use client';
import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { api, errMsg } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { ErrorState, PageLoader } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import type { Category } from '@/types';

const blank = { name: '', slug: '', description: '', order: 0 };

export default function AdminCategories() {
  const toast = useToast(); const { data, loading, error, reload } = useFetch<Category[]>('/categories');
  const [form, setForm] = useState(blank); const [editId, setEditId] = useState<string | null>(null); const [del, setDel] = useState<Category | null>(null); const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try { if (editId) await api.put(`/categories/${editId}`, form); else await api.post('/categories', form); toast.success('Saved'); setForm(blank); setEditId(null); await reload(); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Categories</h1>
      <form onSubmit={save} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_1fr_90px_auto] sm:items-end">
        <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Input label="Order" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
        <div className="flex gap-2"><Button type="submit" className="h-11" loading={busy}>{editId ? 'Update' : 'Add'}</Button>{editId && <Button type="button" className="h-11" variant="secondary" onClick={() => { setEditId(null); setForm(blank); }}>Cancel</Button>}</div>
      </form>
      {loading ? <PageLoader /> : error || !data ? <ErrorState message={error} onRetry={reload} /> : (
        <DataTable rows={data} rowKey={(c) => c.id} empty="No categories" columns={[
          { header: 'Name', cell: (c) => <span className="font-medium">{c.name}</span> }, { header: 'Slug', cell: (c) => c.slug }, { header: 'Order', cell: (c) => c.order },
          { header: '', className: 'text-right', cell: (c) => <div className="flex justify-end gap-1"><button aria-label="Edit" className="rounded p-2 hover:bg-slate-100" onClick={() => { setEditId(c.id); setForm({ name: c.name, slug: c.slug, description: c.description, order: c.order }); }}><Pencil className="h-4 w-4" /></button><button aria-label="Delete" className="rounded p-2 text-red-600 hover:bg-red-50" onClick={() => setDel(c)}><Trash2 className="h-4 w-4" /></button></div> },
        ]} />
      )}
      <ConfirmDialog open={!!del} danger title="Delete category" message={`Delete "${del?.name}"?`} confirmLabel="Delete" onClose={() => setDel(null)}
        onConfirm={async () => { try { await api.delete(`/categories/${del!.id}`); toast.success('Deleted'); await reload(); } catch (e) { toast.error(errMsg(e)); } }} />
    </div>
  );
}
