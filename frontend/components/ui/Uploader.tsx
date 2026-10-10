'use client';
import { useRef, useState } from 'react';
import Image from 'next/image';
import { FileText, ImagePlus, Trash2, UploadCloud } from 'lucide-react';
import { api, errMsg } from '@/lib/api';
import { Button } from './Button';

export interface Uploaded { url: string; publicId: string; fileName?: string; }

interface BaseProps { kind: 'image' | 'pdf' | 'resource'; label: string; accept: string; maxMB: number; value: Uploaded | null; onChange: (v: Uploaded | null) => void; }

function useUpload(kind: BaseProps['kind'], maxMB: number, onChange: BaseProps['onChange']) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  async function upload(file: File, previous: Uploaded | null) {
    setError('');
    if (file.size > maxMB * 1024 * 1024) { setError(`File is larger than ${maxMB}MB`); return; }
    const fd = new FormData(); fd.append('file', file);
    try {
      setProgress(0);
      const r = await api.post(`/admin/upload?kind=${kind}`, fd, { onUploadProgress: (e) => setProgress(e.total ? Math.round((e.loaded / e.total) * 100) : null) });
      onChange(r.data.data as Uploaded);
      if (previous?.publicId) void api.delete('/admin/upload', { data: { publicId: previous.publicId, kind } }).catch(() => undefined);
    } catch (e) { setError(errMsg(e)); } finally { setProgress(null); }
  }
  async function remove(v: Uploaded) {
    try { if (v.publicId) await api.delete('/admin/upload', { data: { publicId: v.publicId, kind } }); } catch { /* ignore: still detach */ }
    onChange(null);
  }
  return { progress, error, upload, remove };
}

export function ImageUploader(p: Omit<BaseProps, 'accept' | 'maxMB'>) {
  const ref = useRef<HTMLInputElement>(null);
  const u = useUpload('image', 5, p.onChange);
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{p.label}</span>
      <div className="flex items-center gap-3">
        <div className="relative h-24 w-36 overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
          {p.value?.url ? <Image src={p.value.url} alt="" fill sizes="144px" className="object-cover" /> : <ImagePlus className="absolute inset-0 m-auto h-6 w-6 text-slate-400" />}
        </div>
        <div className="space-y-2">
          <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void u.upload(f, p.value); e.target.value = ''; }} />
          <Button type="button" size="sm" variant="secondary" onClick={() => ref.current?.click()} loading={u.progress !== null}><UploadCloud className="h-4 w-4" />{p.value ? 'Replace' : 'Upload'}</Button>
          {p.value && <Button type="button" size="sm" variant="ghost" onClick={() => void u.remove(p.value!)}><Trash2 className="h-4 w-4" />Remove</Button>}
          {u.progress !== null && <div className="h-1.5 w-32 overflow-hidden rounded bg-slate-200"><div className="h-full bg-brand-600" style={{ width: `${u.progress}%` }} /></div>}
        </div>
      </div>
      {u.error && <p className="mt-1 text-xs text-red-600">{u.error}</p>}
      <p className="mt-1 text-xs text-slate-500">JPG, PNG or WebP, up to 5MB.</p>
    </div>
  );
}

export function FileUploader(p: Omit<BaseProps, 'accept' | 'maxMB'>) {
  const ref = useRef<HTMLInputElement>(null);
  const u = useUpload(p.kind, 50, p.onChange);
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{p.label}</span>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
        <FileText className="h-6 w-6 text-slate-400" />
        <span className="min-w-0 flex-1 truncate text-sm text-slate-600">{p.value ? (p.value.fileName || 'File uploaded (private)') : 'No file uploaded'}</span>
        <input ref={ref} type="file" accept={p.kind === 'pdf' ? 'application/pdf' : '.pdf,.zip,.docx,.xlsx,.txt'} hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void u.upload(f, p.value); e.target.value = ''; }} />
        <Button type="button" size="sm" variant="secondary" onClick={() => ref.current?.click()} loading={u.progress !== null}>{p.value ? 'Replace' : 'Upload'}</Button>
        {p.value && <Button type="button" size="sm" variant="ghost" onClick={() => void u.remove(p.value!)}><Trash2 className="h-4 w-4" /></Button>}
      </div>
      {u.progress !== null && <div className="mt-2 h-1.5 overflow-hidden rounded bg-slate-200"><div className="h-full bg-brand-600" style={{ width: `${u.progress}%` }} /></div>}
      {u.error && <p className="mt-1 text-xs text-red-600">{u.error}</p>}
      <p className="mt-1 text-xs text-slate-500">Stored privately on Cloudinary. Delivered only to buyers through the backend. Max 50MB.</p>
    </div>
  );
}
