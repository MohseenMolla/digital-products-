import type { ReactNode } from 'react';
import { EmptyState } from './States';

export interface Column<T> { header: string; cell: (row: T) => ReactNode; className?: string; }

export function DataTable<T>({ columns, rows, rowKey, empty = 'Nothing to show yet.' }: { columns: Column<T>[]; rows: T[]; rowKey: (r: T) => string; empty?: string }) {
  if (!rows.length) return <EmptyState title={empty} />;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>{columns.map((c) => <th key={c.header} className={`px-4 py-3 font-semibold ${c.className ?? ''}`}>{c.header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={rowKey(r)} className="hover:bg-slate-50/60">
              {columns.map((c) => <td key={c.header} className={`px-4 py-3 align-middle ${c.className ?? ''}`}>{c.cell(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TONES: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-700', ACTIVE: 'bg-emerald-100 text-emerald-700', COMPLETED: 'bg-emerald-100 text-emerald-700', PUBLISHED: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700', PROCESSING: 'bg-amber-100 text-amber-700', DRAFT: 'bg-slate-100 text-slate-600',
  FAILED: 'bg-red-100 text-red-700', CANCELLED: 'bg-slate-200 text-slate-700', REVOKED: 'bg-red-100 text-red-700', EXPIRED: 'bg-slate-200 text-slate-700',
  REFUNDED: 'bg-purple-100 text-purple-700', SUBMITTED: 'bg-amber-100 text-amber-700', APPROVED: 'bg-emerald-100 text-emerald-700', REJECTED: 'bg-red-100 text-red-700', PAYMENT_MISMATCH: 'bg-red-100 text-red-700',
};
export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[status] ?? 'bg-slate-100 text-slate-700'}`}>{status === 'PROCESSING' ? 'IN REVIEW' : status.replace('_', ' ')}</span>;
}
