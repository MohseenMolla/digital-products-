'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { API_BASE, api, errMsg } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useFetch } from '@/hooks/useFetch';
import { Button, buttonClass } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorState, PageLoader } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/format';
import { CopyRow } from './CopyRow';
import { FileCard } from './FileCard';

interface Resp {
  order: { orderNumber: string; productId: string; productTitle: string; amount: number; paymentStatus: string };
  access: null | {
    title: string; content: string; externalUrl: string; appInstructions: string; hasFile: boolean; fileName: string; downloadsRemaining: number | null;
    expiresAt: string | null; isCourse: boolean;
    credentials: { loginEmail: string; password: string; loginUrl: string; notes: string; expiresAt: string | null } | null;
  };
  canSetPassword: boolean;
  rejectReason?: string | null;
}

function SetPassword({ orderNumber, token, onDone }: { orderNumber: string; token: string; onDone: () => void }) {
  const toast = useToast(); const { refresh } = useAuth();
  const [pw, setPw] = useState(''); const [busy, setBusy] = useState(false);
  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
      <p className="font-semibold">Want to open this from any device?</p>
      <p className="mt-1 text-sm text-slate-600">Create a password to log in later with your email. This is optional; your private link keeps working either way.</p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="min-w-[200px] flex-1"><Input label="New password" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} hint="At least 8 characters" /></div>
        <Button className="h-11" loading={busy} disabled={pw.length < 8} onClick={async () => {
          setBusy(true);
          try { await api.post(`/orders/access/${orderNumber}/set-password`, { token, password: pw }); await refresh(); toast.success('Account ready. You are now logged in.'); onDone(); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
        }}>Create account</Button>
      </div>
    </div>
  );
}

/** Shown after verified payment (success page) and from the emailed private link. No login required. */
export function OrderAccess({ orderNumber, token }: { orderNumber: string; token: string }) {
  const { user } = useAuth();
  const url = `/orders/access/${orderNumber}?token=${encodeURIComponent(token)}`;
  const { data, loading, error, reload, setData } = useFetch<Resp>(url);
  const [claimed, setClaimed] = useState(false);
  const waiting = Boolean(data && !data.access && data.order.paymentStatus === 'PROCESSING');
  // While an admin is verifying, quietly re-check so the download page appears by itself.
  useEffect(() => {
    if (!waiting) return;
    const t = setInterval(() => { api.get(url).then((r) => setData(r.data.data as Resp)).catch(() => undefined); }, 15000);
    return () => clearInterval(t);
  }, [waiting, url, setData]);
  if (loading) return <PageLoader text="Loading your product..." />;
  if (error || !data) return <ErrorState message={error || 'This access link is not valid.'} onRetry={reload} />;
  if (!data.access) {
    const st = data.order.paymentStatus;
    const payHref = `/payment/${orderNumber}?token=${encodeURIComponent(token)}`;
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        {st === 'PROCESSING' ? (<><h2 className="text-xl font-bold">Payment submitted</h2><p className="mt-2 text-slate-600">We are verifying your transaction. This page updates automatically, and we will email your link as soon as it is approved.</p></>)
          : st === 'FAILED' ? (<><h2 className="text-xl font-bold">Payment rejected</h2><p className="mt-2 text-slate-600">{data.rejectReason || 'We could not verify your transaction.'} Please submit the correct transaction ID.</p><Link href={payHref} className={buttonClass('primary', 'lg', 'mt-5')}>Submit again</Link></>)
          : (<><h2 className="text-xl font-bold">Payment not completed</h2><p className="mt-2 text-slate-600">Send the payment and submit your transaction ID to unlock {data.order.productTitle}.</p><Link href={payHref} className={buttonClass('primary', 'lg', 'mt-5')}>Go to payment</Link></>)}
      </div>
    );
  }
  const a = data.access;
  const fileUrl = `${API_BASE}/orders/access/${orderNumber}/file?token=${encodeURIComponent(token)}`;
  return (
    <div className="space-y-5 text-left">
      {data.order.paymentStatus !== 'PAID' && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Your payment is being verified. You can use your product now, but access will be removed if the transaction cannot be confirmed.</p>}
      <div><h2 className="text-xl font-bold">{a.title}</h2><p className="text-sm text-slate-500">{a.expiresAt ? `Access until ${formatDate(a.expiresAt)}` : 'Lifetime access'}</p></div>

      {a.hasFile && <FileCard fileUrl={fileUrl} fileName={a.fileName} remaining={a.downloadsRemaining} />}

      {a.credentials && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="font-semibold">Premium App Access</p>
          <CopyRow label="Username / email" value={a.credentials.loginEmail} />
          <CopyRow label="Password" value={a.credentials.password} secret />
          {a.credentials.loginUrl && <a href={a.credentials.loginUrl} target="_blank" rel="noopener noreferrer" className={buttonClass('secondary', 'md')}><ExternalLink className="h-4 w-4" />Open login page</a>}
          {a.credentials.expiresAt && <p className="text-sm text-slate-600">Credentials expire: {formatDate(a.credentials.expiresAt)}</p>}
          {a.credentials.notes && <p className="whitespace-pre-line rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{a.credentials.notes}</p>}
        </div>
      )}
      {a.appInstructions && <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="font-semibold">Instructions</p><p className="mt-2 whitespace-pre-line text-sm text-slate-700">{a.appInstructions}</p></div>}
      {a.externalUrl && <a href={a.externalUrl} target="_blank" rel="noopener noreferrer" className={buttonClass('primary', 'lg')}><ExternalLink className="h-4 w-4" />Open product</a>}
      {a.content && <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="font-semibold">Content</p><div className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{a.content}</div></div>}

      {a.isCourse && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="font-semibold">Course lessons</p>
          {user ? <Link href={`/dashboard/courses/${data.order.productId}`} className={buttonClass('primary', 'lg', 'mt-3')}>Start learning</Link>
            : <p className="mt-1 text-sm text-slate-600">Lessons play inside your account. {data.canSetPassword ? 'Create a password below to start learning.' : 'Log in with your email to start learning.'}</p>}
        </div>
      )}

      {data.canSetPassword && !claimed && !user && <SetPassword orderNumber={orderNumber} token={token} onDone={() => setClaimed(true)} />}
      {user && <Link href="/dashboard/purchases" className={buttonClass('secondary', 'md')}>Go to my purchases</Link>}
      <p className="text-xs text-slate-500">Keep your access link private. We also emailed it to you. Lost it later? <Link className="underline" href="/recover">Get your links again</Link>.</p>
    </div>
  );
}
