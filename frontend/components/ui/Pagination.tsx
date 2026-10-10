import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Link-based pagination for server-rendered pages. */
export function Pagination({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (p: number) => string }) {
  if (pages <= 1) return null;
  const cls = 'inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 px-3 text-sm hover:bg-slate-50';
  return (
    <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
      {page > 1 ? <Link href={hrefFor(page - 1)} className={cls}><ChevronLeft className="h-4 w-4" />Prev</Link> : <span />}
      <span className="text-sm text-slate-600">Page {page} of {pages}</span>
      {page < pages ? <Link href={hrefFor(page + 1)} className={cls}>Next<ChevronRight className="h-4 w-4" /></Link> : <span />}
    </nav>
  );
}

/** Button-based pagination for client-side admin tables. */
export function PagerButtons({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  const cls = 'inline-flex h-9 items-center rounded-lg border border-slate-300 px-3 text-sm hover:bg-slate-50 disabled:opacity-40';
  return (
    <div className="mt-4 flex items-center justify-end gap-3">
      <button className={cls} disabled={page <= 1} onClick={() => onChange(page - 1)}>Prev</button>
      <span className="text-sm text-slate-600">Page {page} of {pages}</span>
      <button className={cls} disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
    </div>
  );
}
