'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ExternalLink, PlayCircle } from 'lucide-react';
import { API_BASE } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import { CopyRow } from '@/components/CopyRow';
import { FileCard } from '@/components/FileCard';
import { buttonClass } from '@/components/ui/Button';
import { ErrorState, PageLoader } from '@/components/ui/States';
import { formatDate } from '@/lib/format';

interface Access {
  id: string; title: string; productType: string; content: string; externalUrl: string; appInstructions: string;
  hasFile: boolean; fileName: string; downloadsRemaining: number | null; downloadCount: number; expiresAt: string | null; isCourse: boolean;
  credentials: { loginEmail: string; password: string; loginUrl: string; notes: string; expiresAt: string | null } | null;
}

export default function ProductAccessPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, reload } = useFetch<Access>(`/purchases/product/${id}`);
  if (loading) return <PageLoader />;
  if (error || !data) return <div className="space-y-4"><ErrorState message={error || 'Unable to load product'} onRetry={reload} /><Link href="/dashboard/purchases" className="text-sm font-semibold text-brand-700">Back to purchases</Link></div>;
  const file = `${API_BASE}/products/${data.id}/download`;
  return (
    <div className="max-w-2xl space-y-6">
      <div><h1 className="text-2xl font-bold">{data.title}</h1><p className="text-sm text-slate-500">{data.expiresAt ? `Access until ${formatDate(data.expiresAt)}` : 'Lifetime access'}</p></div>

      {data.isCourse && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="font-semibold">Course content</p>
          <Link href={`/dashboard/courses/${data.id}`} className={buttonClass('primary', 'lg', 'mt-3')}><PlayCircle className="h-5 w-5" />Start learning</Link></div>
      )}

      {data.hasFile && <FileCard fileUrl={file} fileName={data.fileName} remaining={data.downloadsRemaining} />}

      {data.credentials && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="font-semibold">Premium App Access</p>
          <CopyRow label="Username / email" value={data.credentials.loginEmail} />
          <CopyRow label="Password" value={data.credentials.password} secret />
          {data.credentials.loginUrl && <a href={data.credentials.loginUrl} target="_blank" rel="noopener noreferrer" className={buttonClass('secondary', 'md')}><ExternalLink className="h-4 w-4" />Open login page</a>}
          {data.credentials.expiresAt && <p className="text-sm text-slate-600">Credentials expire: {formatDate(data.credentials.expiresAt)}</p>}
          {data.credentials.notes && <p className="whitespace-pre-line rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{data.credentials.notes}</p>}
        </div>
      )}

      {data.appInstructions && <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="font-semibold">Instructions</p><p className="mt-2 whitespace-pre-line text-sm text-slate-700">{data.appInstructions}</p></div>}
      {data.externalUrl && <a href={data.externalUrl} target="_blank" rel="noopener noreferrer" className={buttonClass('primary', 'lg')}><ExternalLink className="h-4 w-4" />Open product</a>}
      {data.content && <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="font-semibold">Content</p><div className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{data.content}</div></div>}
    </div>
  );
}
