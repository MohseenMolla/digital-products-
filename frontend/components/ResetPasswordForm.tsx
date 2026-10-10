'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, errMsg } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z.object({ password: z.string().min(8, 'At least 8 characters'), confirm: z.string() }).refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

export function ResetPasswordForm() {
  const sp = useSearchParams(); const router = useRouter(); const { refresh } = useAuth();
  const email = sp.get('email') ?? ''; const token = sp.get('token') ?? '';
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  if (!email || !token) return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">This reset link is incomplete. <Link className="font-semibold underline" href="/forgot-password">Request a new one</Link>.</p>;
  return (
    <form className="space-y-4" onSubmit={handleSubmit(async (d) => { setError(''); try { await api.post('/auth/reset-password', { email, token, password: d.password }); await refresh(); router.push('/dashboard'); } catch (e) { setError(errMsg(e)); } })}>
      <Input label="New password" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
      <Input label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirm?.message} {...register('confirm')} />
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error} <Link className="font-semibold underline" href="/forgot-password">Request a new link</Link></p>}
      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Set new password</Button>
    </form>
  );
}
