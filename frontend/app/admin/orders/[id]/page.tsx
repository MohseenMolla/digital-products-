'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { api, errMsg } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatusBadge } from '@/components/ui/DataTable';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ErrorState, PageLoader } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { formatBDT, formatDateTime } from '@/lib/format';

interface Detail {
  order: { _id: string; orderNumber: string; customerName: string; customerEmail: string; customerPhone: string; productTitleSnapshot: string; subtotal: number; discount: number; couponCode?: string; amount: number; paymentStatus: string; paymentMethod?: string; transactionId?: string; timeline: { event: string; note: string; at: string }[]; paidAt?: string };
  transactions: { _id: string; transactionId: string; paymentMethod?: string; status: string; amount: number; source: string; verifiedAt: string; createdAt: string; gatewayResponse: { senderNumber?: string; sentTo?: string; accountType?: string } }[];
  purchase: { id: string; accessStatus: string; accessGrantedAt: string; expiresAt: string | null; downloadCount: number; revokedReason?: string } | null;
}

const Row = ({ k, v }: { k: string; v: React.ReactNode }) => <div className="flex justify-between gap-4 py-1.5 text-sm"><dt className="text-slate-500">{k}</dt><dd className="break-all text-right font-medium">{v}</dd></div>;

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>(); const toast = useToast();
  const { data, loading, error, reload } = useFetch<Detail>(`/admin/orders/${id}`);
  const [modal, setModal] = useState<'approve' | 'reject' | null>(null); const [text, setText] = useState(''); const [busy, setBusy] = useState(false); const [revoke, setRevoke] = useState(false);
  if (loading) return <PageLoader />;
  if (error || !data) return <ErrorState message={error} onRetry={reload} />;
  const { order: o, transactions, purchase } = data;
  const canDecide = o.paymentStatus !== 'PAID' && o.paymentStatus !== 'REFUNDED';

  async function decide() {
    setBusy(true);
    try {
      if (modal === 'approve') await api.post(`/admin/orders/${id}/approve`, { note: text });
      else await api.post(`/admin/orders/${id}/reject`, { reason: text || 'Transaction could not be verified' });
      toast.success(modal === 'approve' ? 'Payment approved' : 'Payment rejected and access removed');
      setModal(null); setText(''); await reload();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3"><Link href="/admin/orders" className="text-sm text-brand-700">← Orders</Link><h1 className="text-2xl font-bold">{o.orderNumber}</h1><StatusBadge status={o.paymentStatus} /></div>

      {canDecide && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-semibold text-amber-900">{o.paymentStatus === 'PROCESSING' ? 'Awaiting your verification' : 'No transaction submitted yet'}</p>
          <p className="mt-1 text-sm text-amber-800">
            {o.transactionId ? <>Check that <b>{formatBDT(o.amount)}</b> arrived in your <b>{o.paymentMethod}</b> account with TrxID <b className="font-mono">{o.transactionId}</b>, then approve. If it did not arrive, reject: access is removed and the buyer can resubmit.</> : 'Approving without a submitted transaction should only be done if you received the money another way. It is recorded in the audit log.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => { setText(''); setModal('approve'); }}><CheckCircle2 className="h-4 w-4" />Approve payment</Button>
            <Button variant="danger" onClick={() => { setText(''); setModal('reject'); }}><XCircle className="h-4 w-4" />Reject</Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <dl className="rounded-xl border border-slate-200 bg-white p-4"><p className="mb-2 font-semibold">Customer</p><Row k="Name" v={o.customerName} /><Row k="Email" v={o.customerEmail} /><Row k="Phone" v={o.customerPhone} /><Row k="Product" v={o.productTitleSnapshot} /></dl>
        <dl className="rounded-xl border border-slate-200 bg-white p-4"><p className="mb-2 font-semibold">Payment</p><Row k="Subtotal" v={formatBDT(o.subtotal)} /><Row k="Discount" v={`${formatBDT(o.discount)}${o.couponCode ? ` (${o.couponCode})` : ''}`} /><Row k="Total to receive" v={formatBDT(o.amount)} /><Row k="Method" v={o.paymentMethod ?? '-'} /><Row k="TrxID" v={o.transactionId ?? '-'} /><Row k="Paid at" v={formatDateTime(o.paidAt)} /></dl>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-2 font-semibold">Access</p>
        {purchase ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <dl className="flex-1"><Row k="Status" v={<StatusBadge status={purchase.accessStatus} />} /><Row k="Granted" v={formatDateTime(purchase.accessGrantedAt)} /><Row k="Expires" v={purchase.expiresAt ? formatDateTime(purchase.expiresAt) : 'Lifetime'} /><Row k="Downloads" v={purchase.downloadCount} />{purchase.revokedReason && <Row k="Revoke reason" v={purchase.revokedReason} />}</dl>
            {purchase.accessStatus === 'REVOKED'
              ? <Button variant="secondary" onClick={async () => { try { await api.post(`/admin/purchases/${purchase.id}/restore`); toast.success('Access restored'); await reload(); } catch (e) { toast.error(errMsg(e)); } }}>Restore access</Button>
              : <Button variant="danger" onClick={() => setRevoke(true)}>Revoke access</Button>}
          </div>
        ) : <p className="text-sm text-slate-500">No access has been granted for this order.</p>}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="mb-3 font-semibold">Submitted transactions</p>
        {transactions.length === 0 ? <p className="text-sm text-slate-500">None</p> : transactions.map((t) => (
          <div key={t._id} className="mb-2 rounded-lg border border-slate-200 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2"><span className="font-mono font-semibold">{t.transactionId}</span><StatusBadge status={t.status} /><span className="text-slate-500">{t.paymentMethod} · {formatDateTime(t.createdAt)}</span></div>
            <p className="mt-1 text-slate-600">Sent from {t.gatewayResponse?.senderNumber ?? '-'} to {t.gatewayResponse?.sentTo ?? '-'} ({t.gatewayResponse?.accountType ?? '-'}) · {formatBDT(t.amount)}</p>
          </div>
        ))}</div>

      <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="mb-3 font-semibold">Timeline</p>
        <ol className="space-y-2 border-l-2 border-slate-200 pl-4">{o.timeline.map((t, i) => <li key={i} className="text-sm"><span className="font-semibold">{t.event}</span> <span className="text-slate-500">· {formatDateTime(t.at)}</span><p className="text-slate-600">{t.note}</p></li>)}</ol></div>

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'approve' ? 'Approve payment' : 'Reject payment'}>
        {modal === 'approve'
          ? <><p className="mb-3 text-sm text-slate-600">This marks the order paid, counts it as revenue and sends the confirmation email.</p><Input label="Note (optional)" value={text} onChange={(e) => setText(e.target.value)} /></>
          : <><p className="mb-3 text-sm text-slate-600">Access is removed immediately. The buyer is told to submit a correct transaction ID.</p><Textarea label="Reason shown to the buyer" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Transaction ID not found in our account" /></>}
        <div className="mt-4 flex justify-end gap-2"><Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button><Button variant={modal === 'reject' ? 'danger' : 'primary'} loading={busy} onClick={decide}>{modal === 'approve' ? 'Approve' : 'Reject & remove access'}</Button></div>
      </Modal>
      <ConfirmDialog open={revoke} danger title="Revoke access" message="The customer will immediately lose access to this product." confirmLabel="Revoke" onClose={() => setRevoke(false)}
        onConfirm={async () => { try { await api.post(`/admin/purchases/${purchase!.id}/revoke`, { reason: 'Revoked by admin' }); toast.success('Access revoked'); await reload(); } catch (e) { toast.error(errMsg(e)); } }} />
    </div>
  );
}
