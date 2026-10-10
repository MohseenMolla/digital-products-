'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2 } from 'lucide-react';
import { api, errMsg } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z.object({ email: z.string().email('Enter a valid email') });

/** One-field "send me an email" form used by forgot-password and lost-link recovery. */
export function EmailActionForm({ endpoint, button, doneText }: { endpoint: string; button: string; doneText: string }) {
  const [done, setDone] = useState(false); const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  if (done) return <p className="flex items-start gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{doneText}</p>;
  return (
    <form className="space-y-4" onSubmit={handleSubmit(async (d) => { setError(''); try { await api.post(endpoint, d); setDone(true); } catch (e) { setError(errMsg(e)); } })}>
      <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>{button}</Button>
    </form>
  );
}
