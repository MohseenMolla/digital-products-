'use client';

import { useEffect, useState } from 'react';
import { getConsent, setConsent, type ConsentState } from '@/lib/consent';
import { Check, Sliders } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export function CookiePreferences() {
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<ConsentState>({ necessary: true, analytics: false, marketing: false });

  useEffect(() => {
    setState(getConsent());
    setMounted(true);
  }, []);

  const handleSave = () => {
    setConsent(state);
    toast.success('কুকি পছন্দসমূহ সফলভাবে সংরক্ষণ করা হয়েছে');
  };

  const handleAcceptAll = () => {
    const full = { necessary: true, analytics: true, marketing: true };
    setState(full);
    setConsent(full);
    toast.success('সমস্ত কুকি অনুমোদিত হয়েছে');
  };

  const handleRejectAll = () => {
    const min = { necessary: true, analytics: false, marketing: false };
    setState(min);
    setConsent(min);
    toast.success('শুধুমাত্র প্রয়োজনীয় কুকি সংরক্ষিত হয়েছে');
  };

  if (!mounted) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 animate-pulse">
        কুকি সেটিংস লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
      <div className="flex items-center gap-2 font-semibold text-slate-900">
        <Sliders className="h-5 w-5 text-brand-600" />
        <span>আপনার বর্তমান কুকি পছন্দসমূহ (Manage Your Consent)</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        নিচের অপশনগুলো পরিবর্তন করে যেকোনো সময় আপনার ট্র্যাকিং সম্মতি নিয়ন্ত্রণ করতে পারেন।
      </p>

      <div className="mt-5 space-y-4">
        {/* Necessary */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 text-sm">প্রয়োজনীয় কুকি (Necessary)</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                সর্বদা সক্রিয়
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              লগইন সেশন, শপিং কার্ট এবং সিকিউরিটি ফিচার কার্যকর রাখার জন্য এই কুকি অপরিহার্য।
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked="true"
            disabled
            className="relative h-6 w-11 shrink-0 cursor-not-allowed rounded-full bg-brand-600 opacity-70"
          >
            <span className="absolute left-0.5 top-0.5 h-5 w-5 translate-x-5 rounded-full bg-white shadow" />
          </button>
        </div>

        {/* Analytics */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <span className="font-semibold text-slate-800 text-sm">অ্যানালিটিক্স কুকি (Analytics)</span>
            <p className="mt-1 text-xs text-slate-500">
              Google Analytics 4 ও ভিজিটর ব্যবহারের পরিসংখ্যান সংগ্রহের জন্য ব্যবহৃত হয়।
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={state.analytics}
            onClick={() => setState((prev) => ({ ...prev, analytics: !prev.analytics }))}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              state.analytics ? 'bg-brand-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                state.analytics ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Marketing */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <span className="font-semibold text-slate-800 text-sm">মার্কেটিং ও বিজ্ঞাপন (Marketing)</span>
            <p className="mt-1 text-xs text-slate-500">
              Meta Pixel, TikTok Pixel এবং Google Ads কনভার্সন অপ্টিমাইজেশনের জন্য ব্যবহৃত হয়।
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={state.marketing}
            onClick={() => setState((prev) => ({ ...prev, marketing: !prev.marketing }))}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              state.marketing ? 'bg-brand-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                state.marketing ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-700"
        >
          <Check className="h-4 w-4" />
          পছন্দ সংরক্ষণ করুন
        </button>
        <button
          type="button"
          onClick={handleAcceptAll}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
        >
          সব অনুমোদন করুন
        </button>
        <button
          type="button"
          onClick={handleRejectAll}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
        >
          শুধুমাত্র প্রয়োজনীয় রাখুন
        </button>
      </div>
    </div>
  );
}
