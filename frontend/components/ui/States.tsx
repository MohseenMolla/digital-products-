import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export function PageLoader({ text = 'Loading...' }: { text?: string }) {
  return <div className="flex min-h-[40vh] items-center justify-center gap-2 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />{text}</div>;
}
export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center">
      <Inbox className="mb-3 h-8 w-8 text-slate-400" />
      <p className="font-semibold text-slate-800">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
      <AlertCircle className="mb-2 h-7 w-7 text-red-500" />
      <p className="text-sm font-medium text-red-700">{message}</p>
      {onRetry && <button onClick={onRetry} className="mt-3 text-sm font-semibold text-red-700 underline">Try again</button>}
    </div>
  );
}
