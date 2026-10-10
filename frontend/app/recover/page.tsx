import type { Metadata } from 'next';
import { EmailActionForm } from '@/components/EmailActionForm';

export const metadata: Metadata = { title: 'Find my purchase', robots: { index: false } };
export default function Page() {
  return (
    <div className="container-x flex justify-center py-12"><div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold">Lost your download link?</h1><p className="mb-6 mt-1 text-sm text-slate-500">Enter the email you used at checkout. We will send your private purchase links to that address.</p>
      <EmailActionForm endpoint="/orders/recover" button="Email my links" doneText="If we found purchases for that email, the links are on their way. Check your spam folder too." />
    </div></div>
  );
}
