'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ExternalLink, Check } from 'lucide-react';
import { API_BASE, api, errMsg } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useFetch } from '@/hooks/useFetch';
import { Button, buttonClass } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorState, PageLoader } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/format';
import { trackPurchase, trackPaymentFailed, trackDownload } from '@/lib/tracking';
import { CopyRow } from './CopyRow';

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

  useEffect(() => {
    if (!data) return;
    try {
      if (data.access) {
        const key = `sv_tracked_${data.order.orderNumber}`;
        if (!sessionStorage.getItem(key)) {
          trackPurchase({
            orderNumber: data.order.orderNumber,
            value: data.order.amount,
            productId: data.order.productId,
            productName: data.order.productTitle,
          });
          sessionStorage.setItem(key, '1');
        }
      } else if (data.order.paymentStatus === 'FAILED') {
        const key = `sv_failed_${data.order.orderNumber}`;
        if (!sessionStorage.getItem(key)) {
          trackPaymentFailed({
            orderNumber: data.order.orderNumber,
            value: data.order.amount,
            reason: data.rejectReason || undefined,
          });
          sessionStorage.setItem(key, '1');
        }
      }
    } catch {
      // Ignore session storage errors
    }
  }, [data]);
  
  if (loading) return <PageLoader text="Loading your product..." />;
  if (error || !data) return <ErrorState message={error || 'This access link is not valid.'} onRetry={reload} />;
  
  if (!data.access) {
    const st = data.order.paymentStatus;
    const payHref = `/payment/${orderNumber}?token=${encodeURIComponent(token)}`;
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
        {st === 'PROCESSING' ? (<><h2 className="text-xl font-bold">Payment submitted</h2><p className="mt-2 text-slate-600">We are verifying your transaction. This page updates automatically, and we will email your link as soon as it is approved.</p></>)
          : st === 'FAILED' ? (<><h2 className="text-xl font-bold">Payment rejected</h2><p className="mt-2 text-slate-600">{data.rejectReason || 'We could not verify your transaction.'} Please submit the correct transaction ID.</p><Link href={payHref} className={buttonClass('primary', 'lg', 'mt-5')}>Submit again</Link></>)
          : (<><h2 className="text-xl font-bold">Payment not completed</h2><p className="mt-2 text-slate-600">Send the payment and submit your transaction ID to unlock {data.order.productTitle}.</p><Link href={payHref} className={buttonClass('primary', 'lg', 'mt-5')}>Go to payment</Link></>)}
      </div>
    );
  }
  
  const a = data.access;
  const fileUrl = `${API_BASE}/orders/access/${orderNumber}/file?token=${encodeURIComponent(token)}`;

  // Find instruction text and WhatsApp number if configured
  const instructionText = (a.appInstructions || a.content || (!a.externalUrl?.startsWith('http') ? a.externalUrl : '')).trim();
  const rawWaMatch = (instructionText + ' ' + (a.externalUrl || '')).match(/(?:whatsapp|wa|imo|imo\/whatsapp|contact|admin)[\s:.-]*([0-9+]{10,15})/i) || (instructionText + ' ' + (a.externalUrl || '')).match(/(01[3-9]\d{8})/);
  let waNumber: string | null = null;
  if (rawWaMatch) {
    const digits = rawWaMatch[1].replace(/\D/g, '');
    waNumber = digits.startsWith('880') ? digits : digits.startsWith('01') ? `88${digits}` : digits;
  }
  const isRealUrl = Boolean(a.externalUrl && (a.externalUrl.startsWith('http://') || a.externalUrl.startsWith('https://')));

  return (
    <div className="flex flex-col items-center py-4">
      {data.order.paymentStatus !== 'PAID' && (
        <p className="mb-6 w-full max-w-md rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Your payment is being verified. You can use your product now, but access will be removed if the transaction cannot be confirmed.
        </p>
      )}

      {/* --- EXACT DESIGN LAYOUT START --- */}
      <div className="w-full max-w-[340px]">
        {/* Top Success Card */}
        <div className="flex flex-col items-center justify-center rounded-[24px] border-[2px] border-[#c5e170] bg-white py-6 shadow-sm">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#12b659]">
            <Check className="h-10 w-10 text-white" strokeWidth={3.5} />
          </div>
          <h2 className="mt-4 text-[17px] font-bold text-slate-800">
            Your payment was successful
          </h2>
          <p className="mt-1 text-[11px] font-medium text-slate-500">
            Thank you for your payment.
          </p>
        </div>

        {/* Bengali Confirmation Text */}
        <div className="mt-6 text-center text-[16px] font-medium leading-relaxed text-slate-800">
          আপনার অর্ডারটি কনফার্ম করা<br />
          হয়েছে এবং আপনাকে সম্পূর্ণ<br />
          অ্যাক্সেস দেওয়া হয়েছে।
        </div>

        {/* Gray Action/Download Card */}
        <div className="mt-8 rounded-[32px] bg-[#f5f6f8] p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          {a.hasFile ? (
            <div>
              <a
                href={fileUrl}
                download
                onClick={() => {
                  trackDownload({
                    productId: data.order.productId,
                    productName: data.order.productTitle,
                  });
                }}
                className="flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#02a95c] to-[#8bc53f] py-4 text-[22px] font-bold tracking-wide text-white shadow-lg shadow-green-500/20 transition-transform hover:scale-[1.02] active:scale-95"
              >
                Download
                <svg className="h-[26px] w-[26px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="12" fill="white" />
                  <path d="M12 7V16M12 16L8.5 12.5M12 16L15.5 12.5" stroke="#71b83d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              {a.downloadsRemaining !== null && (
                <p className="mt-3 text-center text-[11px] font-medium text-slate-500">
                  Downloads remaining: {a.downloadsRemaining}
                </p>
              )}
            </div>
          ) : isRealUrl ? (
            <a
              href={a.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#02a95c] to-[#8bc53f] py-4 text-[22px] font-bold tracking-wide text-white shadow-lg shadow-green-500/20 transition-transform hover:scale-[1.02] active:scale-95"
            >
              Access Resource
              <ExternalLink className="h-6 w-6" />
            </a>
          ) : waNumber ? (
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hello, I ordered ${data.order.productTitle} (Order: ${data.order.orderNumber}).`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] py-4 text-[18px] sm:text-[20px] font-bold tracking-wide text-white shadow-lg shadow-green-600/20 transition-transform hover:scale-[1.02] active:scale-95"
            >
              Contact on WhatsApp
              <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
            </a>
          ) : null}

          {/* Delivery Note / Message */}
          {instructionText && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Delivery Instructions / নির্দেশনা</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 whitespace-pre-line">{instructionText}</p>
            </div>
          )}
        </div>
      </div>
      {/* --- EXACT DESIGN LAYOUT END --- */}


      {/* --- ADDITIONAL ACCESS DETAILS (Kept intact below the main layout) --- */}
      <div className="mt-10 w-full max-w-md space-y-5 text-left">
        {a.expiresAt && (
          <p className="text-center text-sm font-medium text-slate-500">
            Access expires: {formatDate(a.expiresAt)}
          </p>
        )}

        {a.credentials && (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
            <p className="font-semibold text-slate-900">Premium App Access</p>
            <CopyRow label="Username / email" value={a.credentials.loginEmail} />
            <CopyRow label="Password" value={a.credentials.password} secret />
            {a.credentials.loginUrl && <a href={a.credentials.loginUrl} target="_blank" rel="noopener noreferrer" className={buttonClass('secondary', 'md', 'w-full')}><ExternalLink className="h-4 w-4" />Open login page</a>}
            {a.credentials.expiresAt && <p className="text-sm text-slate-600">Credentials expire: {formatDate(a.credentials.expiresAt)}</p>}
            {a.credentials.notes && <p className="whitespace-pre-line rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{a.credentials.notes}</p>}
          </div>
        )}

        {a.appInstructions && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="font-semibold text-slate-900">Instructions</p>
            <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{a.appInstructions}</p>
          </div>
        )}

        {a.content && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="font-semibold text-slate-900">Content</p>
            <div className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{a.content}</div>
          </div>
        )}

        {a.isCourse && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="font-semibold text-slate-900">Course lessons</p>
            {user ? <Link href={`/dashboard/courses/${data.order.productId}`} className={buttonClass('primary', 'lg', 'mt-3 w-full')}>Start learning</Link>
              : <p className="mt-1 text-sm text-slate-600">Lessons play inside your account. {data.canSetPassword ? 'Create a password below to start learning.' : 'Log in with your email to start learning.'}</p>}
          </div>
        )}

        {data.canSetPassword && !claimed && !user && <SetPassword orderNumber={orderNumber} token={token} onDone={() => setClaimed(true)} />}
        
        {user && <Link href="/dashboard/purchases" className={buttonClass('secondary', 'md', 'w-full')}>Go to my purchases</Link>}
        
        <p className="text-center text-xs text-slate-500">
          Keep your access link private. We also emailed it to you. Lost it later? <Link className="underline hover:text-brand-600" href="/recover">Get your links again</Link>.
        </p>
      </div>
    </div>
  );
}