'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, errMsg } from '@/lib/api';
import { phonePattern } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

const schema = z.object({ name: z.string().min(2, 'Name is required'), phone: z.string().regex(phonePattern, 'Use a valid Bangladeshi number') });

export default function ProfilePage() {
  const { user, refresh } = useAuth(); const toast = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  useEffect(() => { if (user) reset({ name: user.name, phone: user.phone }); }, [user, reset]);
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Profile</h1>
      <form className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5" onSubmit={handleSubmit(async (d) => { try { await api.put('/auth/profile', d); await refresh(); toast.success('Profile updated'); } catch (e) { toast.error(errMsg(e)); } })}>
        <Input label="Email" value={user?.email ?? ''} disabled readOnly />
        <Input label="Full name" error={errors.name?.message} {...register('name')} />
        <Input label="Phone" inputMode="numeric" error={errors.phone?.message} {...register('phone')} />
        <Button type="submit" loading={isSubmitting}>Save changes</Button>
      </form>
    </div>
  );
}
