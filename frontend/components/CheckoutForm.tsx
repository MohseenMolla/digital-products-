'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock } from 'lucide-react';
import { api, errMsg } from '@/lib/api';
import { phonePattern } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OrderSummary } from './OrderSummary';
import type { Product } from '@/types';

const schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().regex(phonePattern, 'Use a valid Bangladeshi number, e.g. 01XXXXXXXXX'),
  couponCode: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export function CheckoutForm({ product }: { product: Product }) {
  const { user } = useAuth(); const router = useRouter();
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState(''); const [applying, setApplying] = useState(false); const [error, setError] = useState('');
  const { register, handleSubmit, reset, getValues, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { fullName: '', email: '', phone: '', couponCode: '' } });

  useEffect(() => { if (user) reset({ fullName: user.name, email: user.email, phone: user.phone, couponCode: '' }); }, [user, reset]);

  const discount = coupon?.discount ?? 0;
  const total = Math.max(product.price - discount, 0);

  async function applyCoupon() {
    const code = getValues('couponCode')?.trim(); if (!code) return;
    setApplying(true); setCouponMsg('');
    try { const r = await api.post('/coupons/validate', { code, productId: product.id }); setCoupon({ code: r.data.data.code, discount: r.data.data.discount }); setCouponMsg('Coupon applied'); }
    catch (e) { setCoupon(null); setCouponMsg(errMsg(e)); } finally { setApplying(false); }
  }

  async function onSubmit(d: Form) {
    setError('');
    try {
      const r = await api.post('/orders/checkout', { productId: product.id, fullName: d.fullName, email: d.email, phone: d.phone, couponCode: coupon?.code });
      const out = r.data.data as { free: boolean; orderNumber: string; accessToken: string };
      // Free orders go straight to the download page; paid orders go to the payment page.
      router.push(out.free ? `/order/${out.orderNumber}?token=${out.accessToken}` : `/payment/${out.orderNumber}?token=${out.accessToken}`);
    } catch (e) { setError(errMsg(e)); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <form onSubmit={handleSubmit(onSubmit)} className="order-2 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 lg:order-1" noValidate>
        <h2 className="text-lg font-semibold">Your information</h2>
        <Input label="Full name" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input label="Phone number" type="tel" inputMode="numeric" placeholder="01XXXXXXXXX" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
        <div>
          <div className="flex items-end gap-2">
            <div className="flex-1"><Input label="Coupon code (optional)" {...register('couponCode')} /></div>
            <Button type="button" variant="secondary" className="h-11" onClick={applyCoupon} loading={applying}>Apply</Button>
          </div>
          {couponMsg && <p className={`mt-1 text-xs ${coupon ? 'text-emerald-700' : 'text-red-600'}`}>{couponMsg}</p>}
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <Button type="submit" size="lg" className="h-14 w-full text-lg" loading={isSubmitting}>{total > 0 ? `Continue to payment · ৳${total.toLocaleString()}` : 'Get it free'}</Button>
        <p className="flex items-center justify-center gap-2 text-xs text-slate-500"><Lock className="h-3.5 w-3.5" />Pay with bKash, Nagad or Rocket</p>
      </form>
      <div className="order-1 lg:order-2"><OrderSummary title={product.title} price={product.price} discount={discount} total={total} /></div>
    </div>
  );
}
