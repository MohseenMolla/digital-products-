'use client';
import { useState } from 'react';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export function CopyRow({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [show, setShow] = useState(!secret); const toast = useToast();
  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
      <div className="min-w-0 flex-1"><p className="text-xs text-slate-500">{label}</p><p className="truncate font-mono text-sm">{show ? value : '••••••••••'}</p></div>
      {secret && <button onClick={() => setShow((s) => !s)} aria-label="Toggle visibility" className="rounded p-1.5 hover:bg-slate-200">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>}
      <button onClick={async () => { await navigator.clipboard.writeText(value); toast.success('Copied'); }} aria-label={`Copy ${label}`} className="rounded p-1.5 hover:bg-slate-200"><Copy className="h-4 w-4" /></button>
    </div>
  );
}
