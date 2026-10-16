'use client';
import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api, errMsg } from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { ErrorState, PageLoader } from '@/components/ui/States';
import { ImageUploader } from '@/components/ui/Uploader';
import { useToast } from '@/components/ui/Toast';
import type { Settings } from '@/types';

export function SettingsForm({ section }: { section: 'general' | 'homepage' }) {
  const toast = useToast(); const { data, loading, error, reload } = useFetch<Settings>('/settings');
  const [s, setS] = useState<Settings | null>(null); const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setS(data); }, [data]);
  if (loading) return <PageLoader />;
  if (error || !s) return <ErrorState message={error} onRetry={reload} />;
  const up = <K extends keyof Settings>(k: K, v: Settings[K]) => setS({ ...s, [k]: v });
  const hp = <K extends keyof Settings['homepage']>(k: K, v: Settings['homepage'][K]) => setS({ ...s, homepage: { ...s.homepage, [k]: v } });
  async function save(e: React.FormEvent) { e.preventDefault(); setBusy(true); try { await api.put('/settings', s); toast.success('Settings saved'); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); } }
  const box = 'space-y-4 rounded-2xl border border-slate-200 bg-white p-5';

  return (
    <form onSubmit={save} className="space-y-6">
      {section === 'general' ? (
        <>
          <div className={box}>
            <Input label="Website name" value={s.siteName} onChange={(e) => up('siteName', e.target.value)} />
            <Input label="Tagline" value={s.tagline} onChange={(e) => up('tagline', e.target.value)} />
            <ImageUploader kind="image" label="Logo" value={s.logoUrl ? { url: s.logoUrl, publicId: '' } : null} onChange={(v) => up('logoUrl', v?.url ?? '')} />
            <ImageUploader kind="image" label="Favicon" value={s.faviconUrl ? { url: s.faviconUrl, publicId: '' } : null} onChange={(v) => up('faviconUrl', v?.url ?? '')} />
          </div>
          <div className={box}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Contact email" value={s.contactEmail} onChange={(e) => up('contactEmail', e.target.value)} /><Input label="Phone" value={s.phone} onChange={(e) => up('phone', e.target.value)} />
              <Input label="WhatsApp number" value={s.whatsapp} onChange={(e) => up('whatsapp', e.target.value)} /><Input label="Facebook URL" value={s.facebook} onChange={(e) => up('facebook', e.target.value)} />
              <Input label="Telegram URL" value={s.telegram} onChange={(e) => up('telegram', e.target.value)} /><Input label="Google Analytics ID (G-XXXX)" value={s.gaId} onChange={(e) => up('gaId', e.target.value)} />
            </div>
            <Textarea label="Footer text" rows={2} value={s.footerText} onChange={(e) => up('footerText', e.target.value)} />
          </div>
          <div className={box}>
            <p className="font-semibold">Tracking & Analytics</p>
            <p className="text-sm text-slate-500">Set up tracking IDs to enable conversion tracking. Leave empty to disable. Get these IDs from the respective platform dashboards.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="GTM Container ID (GTM-XXXXXXX)" placeholder="GTM-" value={s.gtmId || ''} onChange={(e) => up('gtmId', e.target.value)} />
              <Input label="Microsoft Clarity ID" placeholder="e.g. abc123xyz" value={s.clarityId || ''} onChange={(e) => up('clarityId', e.target.value)} />
              <Input label="Google Ads Conversion ID (AW-XXXXX)" placeholder="AW-XXXXXXXXX" value={s.googleAdsId || ''} onChange={(e) => up('googleAdsId', e.target.value)} />
              <Input label="Google Ads Conversion Label" placeholder="e.g. AbC-D_efGhIjKlMnOpQ" value={s.googleAdsConversionLabel || ''} onChange={(e) => up('googleAdsConversionLabel', e.target.value)} />
              <Input label="Meta Pixel ID" placeholder="e.g. 123456789012345" value={s.metaPixelId || ''} onChange={(e) => up('metaPixelId', e.target.value)} />
              <Input label="Meta CAPI Access Token" placeholder="EAAB..." value={s.metaAccessToken || ''} onChange={(e) => up('metaAccessToken', e.target.value)} />
              <Input label="TikTok Pixel ID" placeholder="e.g. CXXXXXXXXXXXXXXX" value={s.tiktokPixelId || ''} onChange={(e) => up('tiktokPixelId', e.target.value)} />
              <Input label="TikTok Events API Access Token" placeholder="e.g. act_..." value={s.tiktokAccessToken || ''} onChange={(e) => up('tiktokAccessToken', e.target.value)} />
              <div className="sm:col-span-2">
                <Input label="GA4 Measurement Protocol Secret" placeholder="e.g. secret_xxxxxxxxxxxx" value={s.gaMeasurementSecret || ''} onChange={(e) => up('gaMeasurementSecret', e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Server-side Tracking:</span> Meta CAPI, TikTok Events API, and GA4 Measurement Protocol use these tokens to record conversions directly from the server, bypassing ad blockers and browser privacy restrictions for reliable tracking.
            </p>
            <p className="text-xs text-slate-400">Note: If GTM ID is set, GA4 will be managed through GTM instead of directly. Meta Pixel, TikTok Pixel, and Clarity load independently.</p>
          </div>
          <div className={box}>
            <p className="font-semibold">Payment methods (Send Money)</p>
            <p className="text-sm text-slate-500">Customers send money to these numbers, then submit their transaction ID. Methods without a number are hidden.</p>
            {s.payment.methods.map((m, i) => (
              <div key={m.key} className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[110px_1fr_150px_auto] sm:items-end">
                <p className="font-semibold sm:pb-3">{m.label}</p>
                <Input label="Receiving number" inputMode="numeric" value={m.number} onChange={(e) => up('payment', { ...s.payment, methods: s.payment.methods.map((x, j) => (j === i ? { ...x, number: e.target.value } : x)) })} />
                <Select label="Account type" value={m.accountType} onChange={(e) => up('payment', { ...s.payment, methods: s.payment.methods.map((x, j) => (j === i ? { ...x, accountType: e.target.value } : x)) })}><option>Send Money</option><option>Personal</option><option>Agent</option><option>Payment</option></Select>
                <label className="flex items-center gap-2 pb-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={m.enabled} onChange={(e) => up('payment', { ...s.payment, methods: s.payment.methods.map((x, j) => (j === i ? { ...x, enabled: e.target.checked } : x)) })} />Enabled</label>
              </div>
            ))}
            <Textarea label="Note shown on the payment page (optional)" rows={2} value={s.payment.note} onChange={(e) => up('payment', { ...s.payment, note: e.target.value })} />
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={s.payment.instantAccess} onChange={(e) => up('payment', { ...s.payment, instantAccess: e.target.checked })} />
              <span><b>Instant access after submitting a transaction ID.</b> Buyers get the download page immediately. Orders stay &quot;In review&quot; (and out of revenue) until you approve them in Admin &gt; Orders. Anyone can type a fake ID, so check each one against your {s.payment.methods.map((m) => m.label).join('/')} statement and reject fakes (this removes their access). Turn this off to require your approval before any access.</span></label>
          </div>
        </>
      ) : (
        <>
          <div className={box}>
            <Input label="Hero title" value={s.homepage.heroTitle} onChange={(e) => hp('heroTitle', e.target.value)} />
            <Textarea label="Hero subtitle" rows={2} value={s.homepage.heroSubtitle} onChange={(e) => hp('heroSubtitle', e.target.value)} />
            <div className="grid gap-2 sm:grid-cols-2">{([['showFeatured', 'Featured products'], ['showCourses', 'Popular courses'], ['showApps', 'Premium apps'], ['showResources', 'Latest resources']] as const).map(([k, l]) => (
              <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={s.homepage[k]} onChange={(e) => hp(k, e.target.checked)} />Show: {l}</label>))}</div>
          </div>
          <div className={box}><p className="font-semibold">Why choose us</p>
            {s.homepage.whyChoose.map((w, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-slate-200 p-3"><Input placeholder="Title" value={w.title} onChange={(e) => hp('whyChoose', s.homepage.whyChoose.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                <Textarea rows={2} placeholder="Text" value={w.text} onChange={(e) => hp('whyChoose', s.homepage.whyChoose.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
                <Button type="button" size="sm" variant="ghost" onClick={() => hp('whyChoose', s.homepage.whyChoose.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" />Remove</Button></div>))}
            <Button type="button" size="sm" variant="secondary" onClick={() => hp('whyChoose', [...s.homepage.whyChoose, { title: '', text: '' }])}><Plus className="h-4 w-4" />Add item</Button></div>
          <div className={box}><p className="font-semibold">Homepage FAQ</p>
            {s.homepage.faqs.map((q, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-slate-200 p-3"><Input placeholder="Question" value={q.question} onChange={(e) => hp('faqs', s.homepage.faqs.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))} />
                <Textarea rows={2} placeholder="Answer" value={q.answer} onChange={(e) => hp('faqs', s.homepage.faqs.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))} />
                <Button type="button" size="sm" variant="ghost" onClick={() => hp('faqs', s.homepage.faqs.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" />Remove</Button></div>))}
            <Button type="button" size="sm" variant="secondary" onClick={() => hp('faqs', [...s.homepage.faqs, { question: '', answer: '' }])}><Plus className="h-4 w-4" />Add FAQ</Button></div>
        </>
      )}
      <Button type="submit" size="lg" loading={busy}>Save</Button>
    </form>
  );
}
