import type { ReactNode } from 'react';

export function StatsCard({ label, value, icon, hint }: { label: string; value: string | number; icon?: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between text-slate-500"><span className="text-sm">{label}</span>{icon}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
