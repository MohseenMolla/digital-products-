'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getConsent, setConsent, hasConsentBeenGiven, type ConsentState } from '@/lib/consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [state, setState] = useState<ConsentState>({ necessary: true, analytics: false, marketing: false });

  useEffect(() => {
    if (!hasConsentBeenGiven()) {
      setState(getConsent());
      setVisible(true);
    }
  }, []);

  const dismiss = (consent: ConsentState) => {
    setConsent(consent);
    setLeaving(true);
    setTimeout(() => setVisible(false), 300);
  };

  const acceptAll = () => dismiss({ necessary: true, analytics: true, marketing: true });
  const necessaryOnly = () => dismiss({ necessary: true, analytics: false, marketing: false });
  const saveCustom = () => dismiss(state);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 transition-all duration-300 ${leaving ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
    >
      <div className="mx-auto max-w-3xl p-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
          <p className="text-sm text-slate-700">
            আমরা আপনার অভিজ্ঞতা উন্নত করতে কুকি ব্যবহার করি। We use cookies to improve your experience and analyze site traffic.{' '}
            <Link href="/privacy-policy" className="font-medium text-brand-600 hover:underline">Privacy Policy</Link>{' · '}
            <Link href="/cookie-policy" className="font-medium text-brand-600 hover:underline">Cookie Policy</Link>
          </p>

          {customize && (
            <div className="mt-4 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <Toggle label="প্রয়োজনীয় (Necessary)" description="সাইট কাজ করতে অপরিহার্য" checked disabled />
              <Toggle label="অ্যানালিটিক্স (Analytics)" description="Google Analytics ইত্যাদি" checked={state.analytics} onChange={(v) => setState({ ...state, analytics: v })} />
              <Toggle label="মার্কেটিং (Marketing)" description="Meta Pixel, TikTok, Google Ads" checked={state.marketing} onChange={(v) => setState({ ...state, marketing: v })} />
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={acceptAll} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700">সব গ্রহণ করুন</button>
            <button type="button" onClick={necessaryOnly} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50">শুধু প্রয়োজনীয়</button>
            {customize ? (
              <button type="button" onClick={saveCustom} className="rounded-lg border border-brand-300 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100">সংরক্ষণ করুন</button>
            ) : (
              <button type="button" onClick={() => setCustomize(true)} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100">কাস্টমাইজ</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, description, checked, disabled, onChange }: {
  label: string; description: string; checked: boolean; disabled?: boolean; onChange?: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-brand-600' : 'bg-slate-300'} ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </label>
  );
}
