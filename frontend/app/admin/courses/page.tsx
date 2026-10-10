'use client';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import { buttonClass } from '@/components/ui/Button';
import { DataTable, StatusBadge } from '@/components/ui/DataTable';
import { ErrorState, PageLoader } from '@/components/ui/States';
import { formatBDT } from '@/lib/format';
import type { Paged } from '@/types';

interface Row { id: string; title: string; price: number; status: string; lessons: number }

export default function AdminCourses() {
  const { data, loading, error, reload } = useFetch<Paged<Row>>('/admin/products?productType=COURSE&limit=100');
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">Courses</h1><Link href="/admin/products/new" className={buttonClass('primary')}><Plus className="h-4 w-4" />New course</Link></div>
      <p className="text-sm text-slate-500">Courses are products of type COURSE. Add modules and lessons from the product editor.</p>
      {loading ? <PageLoader /> : error || !data ? <ErrorState message={error} onRetry={reload} /> : (
        <DataTable rows={data.items} rowKey={(r) => r.id} empty="No courses yet" columns={[
          { header: 'Course', cell: (r) => <span className="font-medium">{r.title}</span> }, { header: 'Lessons', cell: (r) => r.lessons }, { header: 'Price', cell: (r) => formatBDT(r.price) }, { header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
          { header: '', className: 'text-right', cell: (r) => <Link className="text-sm font-semibold text-brand-700" href={`/admin/products/${r.id}`}>Edit content</Link> },
        ]} />
      )}
    </div>
  );
}
