import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/AuthForms';

export const metadata: Metadata = { title: 'Login', robots: { index: false } };
export default function LoginPage() {
  return (
    <div className="container-x flex justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold">Welcome back</h1><p className="mb-6 mt-1 text-sm text-slate-500">Login to access your purchases.</p>
        <Suspense><LoginForm /></Suspense>
      </div>
    </div>
  );
}
