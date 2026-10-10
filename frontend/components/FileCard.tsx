import { Download, Eye, FileText } from 'lucide-react';
import { buttonClass } from '@/components/ui/Button';

/** "Your PDF is ready" card. `fileUrl` is a backend route that checks the purchase before streaming. */
export function FileCard({ fileUrl, fileName, remaining }: { fileUrl: string; fileName: string; remaining: number | null }) {
  const href = (d: 'inline' | 'attachment') => `${fileUrl}${fileUrl.includes('?') ? '&' : '?'}disposition=${d}`;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="flex items-center gap-2 font-semibold"><FileText className="h-5 w-5 text-brand-600" />Your PDF is ready</p>
      <p className="mt-1 text-sm text-slate-500">{fileName}{remaining !== null ? ` · ${remaining} download${remaining === 1 ? '' : 's'} remaining` : ''}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={href('inline')} target="_blank" rel="noopener noreferrer" className={buttonClass('secondary', 'lg')}><Eye className="h-4 w-4" />View PDF</a>
        {remaining === 0 ? <span className="self-center text-sm text-red-600">Download limit reached</span> : <a href={href('attachment')} className={buttonClass('primary', 'lg')}><Download className="h-4 w-4" />Download PDF</a>}
      </div>
    </div>
  );
}
