'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { errMsg } from '@/lib/api';
import { phonePattern } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const safeNext = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard');

const loginSchema = z.object({ email: z.string().email('Enter a valid email'), password: z.string().min(1, 'Password is required') });
export function LoginForm() {
  const { login } = useAuth(); const router = useRouter(); const next = safeNext(useSearchParams().get('next'));
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });
  return (
    <form className="space-y-4" onSubmit={handleSubmit(async (d) => { setError(''); try { const u = await login(d.email, d.password); router.push(u.mustChangePassword ? '/dashboard/security' : next); } catch (e) { setError(errMsg(e)); } })}>
      <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <Input label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex justify-between text-sm"><Link className="text-brand-700" href="/forgot-password">Forgot password?</Link><Link className="text-brand-700" href="/recover">Lost your purchase link?</Link></div>
      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Login</Button>
      <p className="text-center text-sm text-slate-600">New here? <Link className="font-semibold text-brand-700" href={`/register?next=${encodeURIComponent(next)}`}>Create an account</Link></p>
    </form>
  );
}

const regSchema = z.object({
  name: z.string().min(2, 'Name is required'), email: z.string().email('Enter a valid email'),
  phone: z.string().regex(phonePattern, 'Use a valid Bangladeshi number, e.g. 01XXXXXXXXX'),
  password: z.string().min(8, 'At least 8 characters'), confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
export function RegisterForm() {
  const { register: signUp } = useAuth(); const router = useRouter(); const next = safeNext(useSearchParams().get('next'));
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof regSchema>>({ resolver: zodResolver(regSchema) });
  return (
    <form className="space-y-4" onSubmit={handleSubmit(async (d) => { setError(''); try { await signUp(d); router.push(next); } catch (e) { setError(errMsg(e)); } })}>
      <Input label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
      <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <Input label="Phone" type="tel" inputMode="numeric" placeholder="01XXXXXXXXX" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
      <Input label="Password" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
      <Input label="Confirm password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Create account</Button>
      <p className="text-center text-sm text-slate-600">Already registered? <Link className="font-semibold text-brand-700" href={`/login?next=${encodeURIComponent(next)}`}>Login</Link></p>
    </form>
  );
}
