import type { Metadata } from 'next';
import Link from 'next/link';
import { Cookie, ShieldCheck, Activity, Target, Settings, Info, Mail } from 'lucide-react';
import { getSettings } from '@/lib/settings';
import { CookiePreferences } from '@/components/CookiePreferences';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: `Cookie Policy | কুকি নীতি - ${s.siteName}`,
    description: `${s.siteName}-এর কুকি নীতি। জানুন আমরা কীভাবে কুকিজ এবং ট্র্যাকিং প্রযুক্তি ব্যবহার করি এবং কীভাবে আপনি তা নিয়ন্ত্রণ করবেন।`,
    alternates: { canonical: '/cookie-policy' },
  };
}

export default async function CookiePolicyPage() {
  const s = await getSettings();
  const lastUpdated = '১৫ অক্টোবর, ২০২৪';

  return (
    <div className="bg-sand/30 py-12 md:py-16">
      <div className="container-x max-w-4xl">
        {/* Header */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-10 shadow-xs">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <Cookie className="h-4 w-4" />
            স্বচ্ছতা ও ট্র্যাকিং নীতি
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            কুকি নীতি (Cookie Policy)
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            সর্বশেষ হালনাগাদ: {lastUpdated} · {s.siteName}
          </p>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            {s.siteName}-এ আমরা ব্যবহারকারীর অভিজ্ঞতা সহজতর করতে, ওয়েবসাইট পারফরম্যান্স বিশ্লেষণ করতে এবং প্রাসঙ্গিক সেবা প্রদানে কুকিজ ও সংশ্লিষ্ট প্রযুক্তি ব্যবহার করি। এই নীতিমালায় বিস্তারিত জানানো হয়েছে যে আমরা কোন ধরনের কুকি ব্যবহার করি এবং আপনি কীভাবে সেগুলো নিয়ন্ত্রণ করতে পারেন।
          </p>
        </div>

        {/* Interactive Consent Management Card */}
        <div className="mt-8">
          <CookiePreferences />
        </div>

        {/* Content sections */}
        <div className="mt-8 space-y-8">
          {/* Section 1: What are cookies */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Info className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">১. কুকি (Cookies) কী?</h2>
            </div>

            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
              <p>
                কুকি হলো ছোট আকারের টেক্সট ফাইল যা আপনি যখন কোনো ওয়েবসাইট ব্রাউজ করেন, তখন আপনার ব্রাউজার বা ডিভাইসে স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়। এটি ওয়েবসাইটকে আপনার পছন্দের সেটিংস (যেমন লগইন অবস্থা, ভাষা, কার্ট আইটেম) মনে রাখতে সহায়তা করে।
              </p>
              <p>
                কুকির পাশাপাশি আধুনিক ওয়েবে <strong>লোকাল স্টোরেজ (Local Storage)</strong> এবং <strong>সার্ভার-সাইড ইভেন্ট ট্র্যাকিং</strong> ব্যবহৃত হয় যাতে নিরাপদে আপনার অর্ডার ও সেশন সংরক্ষিত থাকে।
              </p>
            </div>
          </section>

          {/* Section 2: Types of cookies */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Settings className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">২. আমরা কোন ধরনের কুকি ব্যবহার করি</h2>
            </div>

            <div className="mt-5 space-y-4">
              {/* Category A: Necessary */}
              <div className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-brand-600" />
                  <h3 className="font-bold text-slate-900">ক. অপরিহার্য বা প্রয়োজনীয় কুকি (Strictly Necessary Cookies)</h3>
                </div>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  ওয়েবসাইটের মৌলিক কার্যকারিতা বজায় রাখতে এই কুকিগুলো অত্যাবশ্যক। এগুলো ছাড়া ওয়েবসাইটে লগইন করা, কার্টে প্রডাক্ট যোগ করা, চেকআউট সম্পন্ন করা বা ইনস্ট্যান্ট ডাউনলোড পেজে প্রবেশ করা সম্ভব নয়।
                </p>
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                  <strong>উদাহরণ:</strong> ব্যবহারকারীর লগইন টোকেন (JWT auth cookie), শপিং কার্ট সেশন, সিএসআরএফ (CSRF) ও রেট-লিমিট নিরাপত্তা ডেটা।
                </div>
              </div>

              {/* Category B: Analytics */}
              <div className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900">খ. অ্যানালিটিক্স ও পারফরম্যান্স কুকি (Analytics Cookies)</h3>
                </div>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  এই কুকিগুলোর সাহায্যে আমরা জানতে পারি কোন পেজগুলো ব্যবহারকারীদের কাছে জনপ্রিয় এবং সাইটে ব্রাউজিং করার সময় কোনো ত্রুটি হচ্ছে কি না। এটি আমাদের সার্ভিসের স্পিড ও কোয়ালিটি বাড়াতে সাহায্য করে। এই তথ্যগুলো সম্পূর্ণ বেনামে (anonymized) সংগৃহীত হয়।
                </p>
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                  <strong>ব্যবহৃত টুল:</strong> Google Analytics 4 (GA4), Google Tag Manager (GTM), Microsoft Clarity (হিটম্যাপ ও ইউজার সেশন রেন্ডারিং)।
                </div>
              </div>

              {/* Category C: Marketing */}
              <div className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-amber-600" />
                  <h3 className="font-bold text-slate-900">গ. মার্কেটিং ও বিজ্ঞাপন কুকি (Marketing & Tracking Cookies)</h3>
                </div>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  ডিজিটাল মার্কেটিং প্ল্যাটফর্মের মাধ্যমে আমাদের কোর্স ও প্রোডাক্টের সঠিক বিজ্ঞাপন প্রদর্শন করতে এবং বিজ্ঞাপন ক্যাম্পেইনের রিটার্ন অন ইনভেস্টমেন্ট (ROI) পরিমাপ করতে এগুলো ব্যবহৃত হয়।
                </p>
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                  <strong>ব্যবহৃত টুল:</strong> Meta Pixel & Conversions API (CAPI), TikTok Pixel & Events API, Google Ads Conversion Tracking।
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Third-Party Tools */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">৩. তৃতীয় পক্ষের সার্ভিস ও কনসেন্ট মোড (Consent Mode v2)</h2>
            </div>

            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
              <p>
                আমাদের প্ল্যাটফর্মে <strong>Google Consent Mode v2</strong> সম্পূর্ণভাবে বাস্তবায়িত রয়েছে। এর অর্থ হলো, আপনি যখন প্রথমবার ওয়েবসাইট ভিজিট করেন, আপনার স্পষ্ট সম্মতি (Consent) ব্যতীত কোনো অ্যানালিটিক্স বা মার্কেটিং কুকি লোড হয় না।
              </p>
              <p>
                যদি আপনি কুকি বাতিল করেন, Google, Meta ও TikTok-এর ক্লায়েন্ট-সাইড ট্র্যাকার স্বয়ংক্রিয়ভাবে ব্লক থাকে এবং কোনো বিজ্ঞাপনী কুকি সেট হয় না।
              </p>
            </div>
          </section>

          {/* Section 4: Browser Control */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Settings className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">৪. ব্রাউজার সেটিংস থেকে কুকি নিয়ন্ত্রণের নিয়ম</h2>
            </div>

            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
              <p>
                আমাদের পেজের উপরের কন্ট্রোল প্যানেল ছাড়াও আপনি আপনার ইন্টারনেট ব্রাউজারের সেটিংস পরিবর্তন করে যেকোনো সময় কুকি মুছে ফেলতে বা ব্লক করতে পারেন:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li><strong>Google Chrome:</strong> Settings &gt; Privacy and security &gt; Third-party cookies</li>
                <li><strong>Mozilla Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies and Site Data</li>
                <li><strong>Apple Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data</li>
                <li><strong>Microsoft Edge:</strong> Settings &gt; Cookies and site permissions</li>
              </ul>
              <p className="text-xs text-slate-500">
                (নোট: প্রয়োজনীয় কুকি ব্লক করলে সাইটের কিছু মৌলিক ফিচার যেমন লগইন বা ডাউনলোড পেজ ঠিকমতো কাজ নাও করতে পারে।)
              </p>
            </div>
          </section>

          {/* Section 5: Contact */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">৫. প্রশ্ন ও যোগাযোগ</h2>
            </div>

            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              কুকি পলিসি বা ট্র্যাকিং সংক্রান্ত যেকোনো প্রশ্ন বা মতামত জানাতে দ্বিধাহীনভাবে আমাদের সাথে যোগাযোগ করুন। আমাদের গোপনীয়তা নীতি সম্পর্কে জানতে{' '}
              <Link href="/privacy-policy" className="font-semibold text-brand-600 hover:underline">
                গোপনীয়তা নীতি (Privacy Policy)
              </Link>{' '}
              দেখুন।
            </p>

            {s.contactEmail && (
              <div className="mt-4">
                <a
                  href={`mailto:${s.contactEmail}`}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-800 transition-colors hover:border-brand-500 hover:bg-brand-50/40"
                >
                  <Mail className="h-4 w-4 text-brand-600" />
                  {s.contactEmail}
                </a>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
