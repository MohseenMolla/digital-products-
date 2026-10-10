'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, errMsg } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

const schema = z.object({ currentPassword: z.string().min(1, 'Required'), newPassword: z.string().min(8, 'At least 8 characters'), confirmPassword: z.string() })
  .refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export default function SecurityPage() {
  const toast = useToast(); const { refresh } = useAuth();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Security</h1>
      <form className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5" onSubmit={handleSubmit(async (d) => { try { await api.put('/auth/change-password', d); await refresh(); reset(); toast.success('Password changed. Other devices were signed out.'); } catch (e) { toast.error(errMsg(e)); } })}>
        <Input label="Current password" type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} />
        <Input label="New password" type="password" autoComplete="new-password" error={errors.newPassword?.message} {...register('newPassword')} />
        <Input label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" loading={isSubmitting}>Update password</Button>
      </form>
    </div>
  );
}
