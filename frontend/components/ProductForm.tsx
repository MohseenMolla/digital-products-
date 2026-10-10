'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api, errMsg } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { FileUploader, ImageUploader, type Uploaded } from '@/components/ui/Uploader';
import { useToast } from '@/components/ui/Toast';
import type { Category } from '@/types';

interface Lesson { _id?: string; title: string; videoUrl: string; description: string; duration: string; resources: { name: string; url: string }[]; }
interface Mod { _id?: string; title: string; lessons: Lesson[]; }
export interface ProductFormData {
  title: string; slug: string; shortDescription: string; description: string; category: string; productType: string; accessType: string;
  price: number; comparePrice: number; thumbnail: string; thumbnailPublicId: string; images: { url: string; publicId: string }[];
  status: 'DRAFT' | 'PUBLISHED'; featured: boolean; bestseller: boolean; stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK';
  duration: number; downloadLimit: number; downloadExpiry: number; allowMultiplePurchases: boolean;
  content: string; pdfUrl: string; pdfPublicId: string; fileName: string; externalUrl: string; appInstructions: string;
  features: string[]; whatYouGet: string[]; faqs: { question: string; answer: string }[]; courseModules: Mod[];
  appCredentials: { loginEmail: string; password: string; loginUrl: string; notes: string; expiresAt: string | null };
}

export const EMPTY_PRODUCT: ProductFormData = {
  title: '', slug: '', shortDescription: '', description: '', category: '', productType: 'COURSE', accessType: 'ONLINE', price: 0, comparePrice: 0,
  thumbnail: '', thumbnailPublicId: '', images: [], status: 'DRAFT', featured: false, bestseller: false, stockStatus: 'IN_STOCK',
  duration: 0, downloadLimit: 0, downloadExpiry: 0, allowMultiplePurchases: false, content: '', pdfUrl: '', pdfPublicId: '', fileName: '',
  externalUrl: '', appInstructions: '', features: [], whatYouGet: [], faqs: [], courseModules: [],
  appCredentials: { loginEmail: '', password: '', loginUrl: '', notes: '', expiresAt: null },
};

const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
const Card = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">{title}</h2>{children}</section>;
const Check = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-brand-600" />{label}</label>;

export function ProductForm({ initial, id }: { initial: ProductFormData; id?: string }) {
  const router = useRouter(); const toast = useToast();
  const { data: cats } = useFetch<Category[]>('/categories');
  const [f, setF] = useState<ProductFormData>(initial); const [saving, setSaving] = useState(false);
  const set = <K extends keyof ProductFormData>(k: K, v: ProductFormData[K]) => setF((p) => ({ ...p, [k]: v }));
  const cred = (k: keyof ProductFormData['appCredentials'], v: string | null) => setF((p) => ({ ...p, appCredentials: { ...p.appCredentials, [k]: v } }));
  const upMod = (mi: number, fn: (m: Mod) => Mod) => set('courseModules', f.courseModules.map((m, i) => (i === mi ? fn(m) : m)));
  const upLesson = (mi: number, li: number, fn: (l: Lesson) => Lesson) => upMod(mi, (m) => ({ ...m, lessons: m.lessons.map((l, i) => (i === li ? fn(l) : l)) }));
  const fileValue: Uploaded | null = f.pdfPublicId ? { url: f.pdfUrl, publicId: f.pdfPublicId, fileName: f.fileName } : null;
  const thumbValue: Uploaded | null = f.thumbnail ? { url: f.thumbnail, publicId: f.thumbnailPublicId } : null;

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const body = { ...f, category: f.category || null, slug: f.slug || undefined,
        appCredentials: { ...f.appCredentials, expiresAt: f.appCredentials.expiresAt || null } };
      if (id) await api.put(`/admin/products/${id}`, body); else await api.post('/admin/products', body);
      toast.success('Product saved'); router.push('/admin/products');
    } catch (err) { toast.error(errMsg(err)); } finally { setSaving(false); }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card title="Basics">
        <Input label="Title" required value={f.title} onChange={(e) => set('title', e.target.value)} />
        <Input label="Slug (optional)" hint="Used in the URL. Generated from the title if empty." value={f.slug} onChange={(e) => set('slug', e.target.value)} />
        <Textarea label="Short description" rows={2} value={f.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} />
        <Textarea label="Full description" rows={6} value={f.description} onChange={(e) => set('description', e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Select label="Product type" value={f.productType} onChange={(e) => set('productType', e.target.value)}>{['COURSE', 'PDF', 'PREMIUM_APP', 'DIGITAL_PRODUCT', 'SUBSCRIPTION', 'OTHER'].map((t) => <option key={t}>{t}</option>)}</Select>
          <Select label="Access type" value={f.accessType} onChange={(e) => set('accessType', e.target.value)}>{['DOWNLOAD', 'ONLINE', 'ACCOUNT', 'EXTERNAL', 'MIXED'].map((t) => <option key={t}>{t}</option>)}</Select>
          <Select label="Category" value={f.category} onChange={(e) => set('category', e.target.value)}><option value="">None</option>{cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
        </div>
      </Card>

      <Card title="Pricing & status">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Price (৳)" type="number" min={0} step="0.01" value={f.price} onChange={(e) => set('price', Number(e.target.value))} />
          <Input label="Original price (৳)" type="number" min={0} step="0.01" hint="Shown struck through; discount is calculated" value={f.comparePrice} onChange={(e) => set('comparePrice', Number(e.target.value))} />
          <Select label="Status" value={f.status} onChange={(e) => set('status', e.target.value as 'DRAFT' | 'PUBLISHED')}><option value="DRAFT">Draft (hidden)</option><option value="PUBLISHED">Published</option></Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <Select label="Stock" value={f.stockStatus} onChange={(e) => set('stockStatus', e.target.value as 'IN_STOCK' | 'OUT_OF_STOCK')}><option value="IN_STOCK">In stock</option><option value="OUT_OF_STOCK">Out of stock</option></Select>
          <Input label="Access duration (days)" type="number" min={0} hint="0 = lifetime" value={f.duration} onChange={(e) => set('duration', Number(e.target.value))} />
          <Input label="Download limit" type="number" min={0} hint="0 = unlimited" value={f.downloadLimit} onChange={(e) => set('downloadLimit', Number(e.target.value))} />
          <Input label="Download window (days)" type="number" min={0} hint="0 = no expiry" value={f.downloadExpiry} onChange={(e) => set('downloadExpiry', Number(e.target.value))} />
        </div>
        <div className="flex flex-wrap gap-6"><Check label="Featured" checked={f.featured} onChange={(v) => set('featured', v)} /><Check label="Bestseller" checked={f.bestseller} onChange={(v) => set('bestseller', v)} /><Check label="Allow repeat purchases" checked={f.allowMultiplePurchases} onChange={(v) => set('allowMultiplePurchases', v)} /></div>
      </Card>

      <Card title="Media">
        <ImageUploader kind="image" label="Thumbnail" value={thumbValue} onChange={(v) => setF((p) => ({ ...p, thumbnail: v?.url ?? '', thumbnailPublicId: v?.publicId ?? '' }))} />
        <div><p className="mb-2 text-sm font-medium">Additional images</p><div className="space-y-3">
          {f.images.map((img, i) => <div key={img.publicId} className="flex items-start gap-3"><div className="flex-1"><ImageUploader kind="image" label={`Image ${i + 1}`} value={img} onChange={(v) => set('images', v ? f.images.map((x, j) => (j === i ? v : x)) : f.images.filter((_, j) => j !== i))} /></div></div>)}
          <ImageUploader kind="image" label="Add image" value={null} onChange={(v) => v && set('images', [...f.images, v])} /></div></div>
      </Card>

      <Card title="Delivery">
        <FileUploader kind={f.productType === 'PDF' ? 'pdf' : 'resource'} label="Protected file (PDF / downloadable)" value={fileValue} onChange={(v) => setF((p) => ({ ...p, pdfUrl: v?.url ?? '', pdfPublicId: v?.publicId ?? '', fileName: v?.fileName ?? '' }))} />
        <Input label="External URL (shown only after purchase)" value={f.externalUrl} onChange={(e) => set('externalUrl', e.target.value)} />
        <Textarea label="Members-only content / notes" value={f.content} onChange={(e) => set('content', e.target.value)} />
        <Textarea label="Activation / app instructions" value={f.appInstructions} onChange={(e) => set('appInstructions', e.target.value)} />
      </Card>

      {(f.productType === 'PREMIUM_APP' || f.productType === 'SUBSCRIPTION' || f.appCredentials.loginEmail) && (
        <Card title="Premium app credentials (encrypted, shown only to verified buyers)">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Login email / username" value={f.appCredentials.loginEmail} onChange={(e) => cred('loginEmail', e.target.value)} />
            <Input label="Password" value={f.appCredentials.password} onChange={(e) => cred('password', e.target.value)} autoComplete="off" />
            <Input label="Login URL" value={f.appCredentials.loginUrl} onChange={(e) => cred('loginUrl', e.target.value)} />
            <Input label="Credentials expiry" type="date" value={f.appCredentials.expiresAt ? f.appCredentials.expiresAt.slice(0, 10) : ''} onChange={(e) => cred('expiresAt', e.target.value || null)} />
          </div>
          <Textarea label="Notes" rows={2} value={f.appCredentials.notes} onChange={(e) => cred('notes', e.target.value)} />
        </Card>
      )}

      <Card title="Marketing copy">
        <Textarea label="Features (one per line)" rows={4} value={f.features.join('\n')} onChange={(e) => set('features', lines(e.target.value))} />
        <Textarea label="What you get (one per line)" rows={4} value={f.whatYouGet.join('\n')} onChange={(e) => set('whatYouGet', lines(e.target.value))} />
        <div className="space-y-3"><p className="text-sm font-medium">FAQs</p>
          {f.faqs.map((q, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-slate-200 p-3">
              <Input placeholder="Question" value={q.question} onChange={(e) => set('faqs', f.faqs.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))} />
              <Textarea rows={2} placeholder="Answer" value={q.answer} onChange={(e) => set('faqs', f.faqs.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))} />
              <Button type="button" size="sm" variant="ghost" onClick={() => set('faqs', f.faqs.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" />Remove</Button>
            </div>
          ))}
          <Button type="button" size="sm" variant="secondary" onClick={() => set('faqs', [...f.faqs, { question: '', answer: '' }])}><Plus className="h-4 w-4" />Add FAQ</Button></div>
      </Card>

      <Card title="Course modules & lessons">
        {f.courseModules.map((m, mi) => (
          <div key={mi} className="space-y-3 rounded-xl border border-slate-200 p-4">
            <div className="flex items-end gap-2"><div className="flex-1"><Input label={`Module ${mi + 1} title`} value={m.title} onChange={(e) => upMod(mi, (x) => ({ ...x, title: e.target.value }))} /></div>
              <Button type="button" variant="ghost" onClick={() => set('courseModules', f.courseModules.filter((_, i) => i !== mi))} aria-label="Remove module"><Trash2 className="h-4 w-4" /></Button></div>
            {m.lessons.map((l, li) => (
              <div key={li} className="space-y-2 rounded-lg bg-slate-50 p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_120px]"><Input placeholder="Lesson title" value={l.title} onChange={(e) => upLesson(mi, li, (x) => ({ ...x, title: e.target.value }))} /><Input placeholder="Duration e.g. 12:30" value={l.duration} onChange={(e) => upLesson(mi, li, (x) => ({ ...x, duration: e.target.value }))} /></div>
                <Input placeholder="Video URL (YouTube, Vimeo or direct .mp4)" value={l.videoUrl} onChange={(e) => upLesson(mi, li, (x) => ({ ...x, videoUrl: e.target.value }))} />
                <Textarea rows={2} placeholder="Description" value={l.description} onChange={(e) => upLesson(mi, li, (x) => ({ ...x, description: e.target.value }))} />
                <Textarea rows={2} placeholder={'Resources, one per line: Name | https://url'} value={l.resources.map((r) => `${r.name} | ${r.url}`).join('\n')}
                  onChange={(e) => upLesson(mi, li, (x) => ({ ...x, resources: lines(e.target.value).map((ln) => { const [n, ...u] = ln.split('|'); return { name: n.trim(), url: u.join('|').trim() }; }).filter((r) => r.name && r.url) }))} />
                <Button type="button" size="sm" variant="ghost" onClick={() => upMod(mi, (x) => ({ ...x, lessons: x.lessons.filter((_, i) => i !== li) }))}><Trash2 className="h-4 w-4" />Remove lesson</Button>
              </div>
            ))}
            <Button type="button" size="sm" variant="secondary" onClick={() => upMod(mi, (x) => ({ ...x, lessons: [...x.lessons, { title: '', videoUrl: '', description: '', duration: '', resources: [] }] }))}><Plus className="h-4 w-4" />Add lesson</Button>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={() => set('courseModules', [...f.courseModules, { title: '', lessons: [] }])}><Plus className="h-4 w-4" />Add module</Button>
      </Card>

      <div className="sticky bottom-0 -mx-1 flex justify-end gap-2 border-t border-slate-200 bg-white/90 p-3 backdrop-blur">
        <Button type="button" variant="secondary" onClick={() => router.push('/admin/products')}>Cancel</Button>
        <Button type="submit" loading={saving}>{id ? 'Save changes' : 'Create product'}</Button>
      </div>
    </form>
  );
}
