import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/ResetPasswordForm';

export const metadata: Metadata = { title: 'Reset password', robots: { index: false } };
export default function Page() {
  return (
    <div className="container-x flex justify-center py-12"><div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold">Choose a new password</h1><p className="mb-6 mt-1 text-sm text-slate-500">You will be logged in after saving.</p>
      <Suspense><ResetPasswordForm /></Suspense>
    </div></div>
  );
}
