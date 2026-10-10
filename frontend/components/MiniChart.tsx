/** Dependency-free bar chart. */
export function BarChart({ data, format }: { data: { label: string; value: number }[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length) return <p className="py-8 text-center text-sm text-slate-500">No data yet</p>;
  return (
    <div className="flex h-44 items-end gap-1" role="img" aria-label="Bar chart">
      {data.map((d) => (
        <div key={d.label} className="group relative flex h-full flex-1 items-end">
          <div className="w-full rounded-t bg-brand-500/80 transition-colors group-hover:bg-brand-600" style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }} />
          <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-0.5 text-[11px] text-white group-hover:block">{d.label}: {format ? format(d.value) : d.value}</span>
        </div>
      ))}
    </div>
  );
}
