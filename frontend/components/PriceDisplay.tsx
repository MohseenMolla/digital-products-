import { formatBDT } from '@/lib/format';

export function PriceDisplay({ price, comparePrice, discountPercent, large }: { price: number; comparePrice?: number; discountPercent?: number; large?: boolean }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={`font-bold text-slate-900 ${large ? 'text-3xl' : 'text-lg'}`}>{price === 0 ? 'Free' : formatBDT(price)}</span>
      {comparePrice ? comparePrice > price && <span className={`text-slate-400 line-through ${large ? 'text-lg' : 'text-sm'}`}>{formatBDT(comparePrice)}</span> : null}
      {discountPercent ? <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-amber-700">{discountPercent}% OFF</span> : null}
    </div>
  );
}
