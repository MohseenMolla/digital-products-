import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RegisterForm } from '@/components/AuthForms';

export const metadata: Metadata = { title: 'Register', robots: { index: false } };
export default function RegisterPage() {
  return (
    <div className="container-x flex justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold">Create your account</h1><p className="mb-6 mt-1 text-sm text-slate-500">It takes less than a minute.</p>
        <Suspense><RegisterForm /></Suspense>
      </div>
    </div>
  );
}
