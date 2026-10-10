import type { Metadata } from 'next';
import { EmailActionForm } from '@/components/EmailActionForm';

export const metadata: Metadata = { title: 'Forgot password', robots: { index: false } };
export default function Page() {
  return (
    <div className="container-x flex justify-center py-12"><div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold">Forgot password</h1><p className="mb-6 mt-1 text-sm text-slate-500">We will email you a link to choose a new password. Bought without an account? This also lets you create one.</p>
      <EmailActionForm endpoint="/auth/forgot-password" button="Send reset link" doneText="If that email has an account, a reset link is on its way. It expires in 1 hour." />
    </div></div>
  );
}
