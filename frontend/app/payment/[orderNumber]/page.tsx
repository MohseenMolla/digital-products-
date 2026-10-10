'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Check, Clock, Copy, ShieldCheck, X } from 'lucide-react';
import { api, errMsg } from '@/lib/api';
import { cn, formatBDT, phonePattern } from '@/lib/format';
import { useFetch } from '@/hooks/useFetch';
import { Button, buttonClass } from '@/components/ui/Button';
import { ErrorState, PageLoader } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';

type Key = 'BKASH' | 'NAGAD' | 'ROCKET';

interface Info {
  order: {
    orderNumber: string;
    productTitle: string;
    subtotal: number;
    discount: number;
    amount: number;
    paymentStatus: string;
    customerPhone: string;
  };
  submitted: { method?: string; transactionId?: string } | null;
  rejectReason: string | null;
  hasAccess: boolean;
  instantAccess: boolean;
  note: string;
  methods: { key: Key; label: string; number: string; accountType: string }[];
}

// Gateway Theme Config per Payment Method
const METHOD_CONFIG: Record<
  Key,
  {
    bg: string;
    primaryBtn: string;
    text: string;
    accent: string;
    ussd: string;
    iconText: string;
  }
> = {
  BKASH: {
    bg: 'bg-[#e2136e]',
    primaryBtn: 'bg-[#e2136e] hover:bg-[#c40f5e]',
    text: 'text-[#e2136e]',
    accent: 'bg-[#c40f5e]',
    ussd: '*247#',
    iconText: 'bKash',
  },
  NAGAD: {
    bg: 'bg-[#f7931e]',
    primaryBtn: 'bg-[#f7931e] hover:bg-[#de7e12]',
    text: 'text-[#f7931e]',
    accent: 'bg-[#de7e12]',
    ussd: '*167#',
    iconText: 'Nagad',
  },
  ROCKET: {
    bg: 'bg-[#8c3494]',
    primaryBtn: 'bg-[#8c3494] hover:bg-[#722979]',
    text: 'text-[#8c3494]',
    accent: 'bg-[#722979]',
    ussd: '*322#',
    iconText: 'Rocket',
  },
};

const schema = z.object({
  senderNumber: z
    .string()
    .regex(phonePattern, 'Use a valid 11 digit number (e.g. 01XXXXXXXXX)'),
  transactionId: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z0-9]{4,30}$/,
      'Enter the valid Transaction ID from SMS (e.g. TrxID)'
    ),
});

function PayForm({ info, token }: { info: Info; token: string }) {
  const router = useRouter();
  const toast = useToast();
  const [method, setMethod] = useState<Key>(info.methods[0]?.key || 'BKASH');
  const [error, setError] = useState('');

  const m = info.methods.find((x) => x.key === method) || info.methods[0];
  const theme = METHOD_CONFIG[method] || METHOD_CONFIG.BKASH;
  const o = info.order;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { senderNumber: o.customerPhone, transactionId: '' },
  });

  async function onSubmit(d: z.infer<typeof schema>) {
    setError('');
    try {
      await api.post(`/orders/pay/${o.orderNumber}`, {
        token,
        method,
        transactionId: d.transactionId,
        senderNumber: d.senderNumber,
      });
      router.replace(`/order/${o.orderNumber}?token=${token}`);
    } catch (e) {
      setError(errMsg(e));
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      {/* Top Method Tabs */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        {info.methods.map((x) => {
          const cfg = METHOD_CONFIG[x.key] || METHOD_CONFIG.BKASH;
          const isSelected = method === x.key;
          return (
            <button
              key={x.key}
              type="button"
              onClick={() => {
                setMethod(x.key);
                setError('');
              }}
              className={cn(
                'flex items-center justify-center rounded-xl py-3 text-sm font-bold shadow-sm transition-all',
                isSelected
                  ? `${cfg.bg} text-white ring-2 ring-offset-2 ${cfg.accent}`
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              )}
            >
              {x.label}
            </button>
          );
        })}
      </div>

      {/* Main Payment Modal Box */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        {/* Gateway Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-1 font-bold text-slate-800">
            <span className={cn('text-xl font-black italic', theme.text)}>
              {m.label}
            </span>
            <span className="text-xs uppercase text-slate-400">Personal</span>
          </div>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cancel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Invoice Summary Box */}
        <div className="mx-4 mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-100">
          <div>
            <p className="text-xs font-medium text-slate-500">Merchant / Product</p>
            <p className="line-clamp-1 font-semibold text-slate-800">{o.productTitle}</p>
            <p className="text-xs text-slate-400">Invoice: <span className="font-mono">{o.orderNumber}</span></p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-slate-900">{formatBDT(o.amount)}</p>
          </div>
        </div>

        {/* Dynamic Theme Form Section */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-4 sm:p-5">
          <div className={cn('rounded-2xl p-5 text-white transition-colors duration-300', theme.bg)}>
            
            {/* Input Header */}
            <p className="text-center text-lg font-bold">ট্রানজেকশন আইডি দিন</p>
            
            <div className="mt-3">
              <input
                type="text"
                placeholder="ট্রানজেকশন আইডি দিন"
                autoCapitalize="characters"
                autoComplete="off"
                className={cn(
                  'w-full rounded-lg bg-white px-4 py-3 text-center text-slate-900 font-mono font-bold tracking-wider placeholder-slate-400 outline-none shadow-inner transition',
                  errors.transactionId && 'ring-2 ring-red-500'
                )}
                {...register('transactionId')}
              />
              {errors.transactionId && (
                <p className="mt-1 text-center text-xs font-medium text-yellow-200">
                  {errors.transactionId.message}
                </p>
              )}
            </div>

            {/* Sender Phone Input */}
            <div className="mt-3">
              <input
                type="tel"
                inputMode="numeric"
                placeholder="আপনার মোবাইল নম্বর দিন (Sender Number)"
                className={cn(
                  'w-full rounded-lg bg-white px-4 py-2.5 text-center text-slate-900 font-medium placeholder-slate-400 outline-none shadow-inner transition text-sm',
                  errors.senderNumber && 'ring-2 ring-red-500'
                )}
                {...register('senderNumber')}
              />
              {errors.senderNumber && (
                <p className="mt-1 text-center text-xs font-medium text-yellow-200">
                  {errors.senderNumber.message}
                </p>
              )}
            </div>

            {/* Instructions List */}
            <ul className="mt-5 space-y-2.5 text-xs sm:text-sm font-medium leading-relaxed opacity-95 border-t border-white/20 pt-4">
              <li className="flex items-start gap-1.5">
                <span className="shrink-0">•</span>
                <span>
                  <strong className="text-yellow-300">{theme.ussd}</strong> ডায়াল করে আপনার <strong>{m.label}</strong> মোবাইল মেনুতে যান অথবা <strong>{m.label} অ্যাপে</strong> যান।
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="shrink-0">•</span>
                <span>
                  &quot;<strong className="text-yellow-300">{m.accountType}</strong>&quot;-এ ক্লিক করুন।
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="shrink-0">•</span>
                <span className="flex-1">
                  প্রাপক নম্বর হিসেবে এই নম্বরটি লিখুন: <strong className="font-mono text-yellow-300 text-sm tracking-wider">{m.number}</strong>
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(m.number);
                    toast.success('Number copied!');
                  }}
                  className="ml-1 inline-flex shrink-0 items-center gap-1 rounded bg-white/20 px-2 py-0.5 text-xs font-bold hover:bg-white/30"
                >
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="shrink-0">•</span>
                <span>
                  টাকার পরিমাণ: <strong className="text-yellow-300">{formatBDT(o.amount)}</strong>
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="shrink-0">•</span>
                <span>নিশ্চিত করতে এখন আপনার {m.label} পিন লিখুন।</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="shrink-0">•</span>
                <span>সবকিছু ঠিক থাকলে, আপনি {m.label} থেকে একটি নিশ্চিতকরণ বার্তা পাবেন।</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="shrink-0">•</span>
                <span>
                  এখন উপরের বাক্সে আপনার <strong>Transaction ID</strong> দিন এবং নিচে <strong>VERIFY</strong> বাটনে ক্লিক করুন।
                </span>
              </li>
            </ul>

            {info.note && (
              <p className="mt-4 rounded-lg bg-black/20 p-2.5 text-center text-xs text-yellow-200">
                {info.note}
              </p>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-center text-sm font-semibold text-red-600 border border-red-200">
              {error}
            </p>
          )}

          {/* Action Verify Button */}
          <Button
            type="submit"
            size="lg"
            className={cn('mt-4 h-12 w-full text-base font-bold tracking-wider text-white uppercase shadow-lg transition-transform active:scale-[0.99]', theme.primaryBtn)}
            loading={isSubmitting}
          >
            VERIFY
          </Button>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            {info.instantAccess
              ? 'Instant verification & automatic access unlocked upon submission.'
              : 'Your transaction will be verified shortly.'}
          </p>
        </form>
      </div>
    </div>
  );
}

function Inner() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const { data, loading, error, reload } = useFetch<Info>(
    token ? `/orders/pay/${orderNumber}?token=${encodeURIComponent(token)}` : null
  );

  useEffect(() => {
    if (data && (data.hasAccess || data.order.paymentStatus === 'PAID')) {
      router.replace(`/order/${orderNumber}?token=${token}`);
    }
  }, [data, router, orderNumber, token]);

  if (!token)
    return (
      <ErrorState message="This payment link is incomplete. Please start again from the product page." />
    );
  if (loading) return <PageLoader />;
  if (error || !data)
    return <ErrorState message={error || 'Order not found'} onRetry={reload} />;
  if (data.hasAccess || data.order.paymentStatus === 'PAID')
    return <PageLoader text="Opening your download page..." />;

  if (data.order.paymentStatus === 'PROCESSING') {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-50">
          <Clock className="h-9 w-9 text-amber-600" />
        </div>
        <h2 className="mt-5 text-2xl font-bold">Payment submitted</h2>
        <p className="mt-2 text-slate-600">
          We are verifying transaction{' '}
          <b className="font-mono">{data.submitted?.transactionId}</b>. Your
          product unlocks as soon as it is approved.
        </p>
        <Link
          className={buttonClass('primary', 'lg', 'mt-6 w-full')}
          href={`/order/${orderNumber}?token=${token}`}
        >
          Check status
        </Link>
      </div>
    );
  }

  if (!data.methods.length)
    return (
      <ErrorState message="Payment methods are not set up yet. Please contact support." />
    );

  return (
    <>
      {data.rejectReason && (
        <p className="mx-auto mb-5 max-w-xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <b>Your last transaction was rejected:</b> {data.rejectReason}. Please
          check the details and submit again.
        </p>
      )}
      <PayForm info={data} token={token} />
      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
        <Check className="h-4 w-4 text-brand-600" /> Order {data.order.orderNumber} · Secure Payment Gateway
      </p>
    </>
  );
}

export default function PaymentPage() {
  return (
    <div className="container-x min-h-[85vh] py-6 md:py-10 bg-slate-50/50">
      <Suspense fallback={<PageLoader />}>
        <Inner />
      </Suspense>
    </div>
  );
}