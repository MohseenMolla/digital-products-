import { formatBDT } from '@/lib/format';

export function OrderSummary({ title, price, discount, total }: { title: string; price: number; discount: number; total: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h2 className="font-semibold">Order summary</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-4"><dt className="text-slate-600">{title}</dt><dd className="shrink-0 font-medium">{formatBDT(price)}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-600">Discount</dt><dd className="font-medium text-emerald-700">-{formatBDT(discount)}</dd></div>
        <div className="flex justify-between border-t border-slate-200 pt-3 text-base"><dt className="font-semibold">Total</dt><dd className="text-xl font-extrabold">{formatBDT(total)}</dd></div>
      </dl>
    </div>
  );
}
