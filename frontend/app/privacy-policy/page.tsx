import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Lock, UserCheck, Cookie, Mail, Phone, MessageSquare, AlertCircle } from 'lucide-react';
import { getSettings } from '@/lib/settings';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: `Privacy Policy | গোপনীয়তা নীতি - ${s.siteName}`,
    description: `${s.siteName}-এর গোপনীয়তা নীতি। আমরা কীভাবে আপনার ব্যক্তিগত তথ্য ও ডেটা সংরক্ষণ এবং সুরক্ষিত রাখি।`,
    alternates: { canonical: '/privacy-policy' },
  };
}

export default async function PrivacyPolicyPage() {
  const s = await getSettings();
  const lastUpdated = '১৫ অক্টোবর, ২০২৪';

  return (
    <div className="bg-sand/30 py-12 md:py-16">
      <div className="container-x max-w-4xl">
        {/* Header */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-10 shadow-xs">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <ShieldCheck className="h-4 w-4" />
            গোপনীয়তা ও ডেটা সুরক্ষা
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            গোপনীয়তা নীতি (Privacy Policy)
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            সর্বশেষ হালনাগাদ: {lastUpdated} · {s.siteName}
          </p>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            {s.siteName}-এ আপনার তথ্যের গোপনীয়তা রক্ষা করা আমাদের অন্যতম প্রধান অগ্রাধিকার। এই গোপনীয়তা নীতিতে আমরা পরিষ্কারভাবে ব্যাখ্যা করেছি কীভাবে আমরা আপনার তথ্য সংগ্রহ, ব্যবহার, সংরক্ষণ এবং সুরক্ষিত রাখি। আমাদের সেবা ব্যবহার করার মাধ্যমে আপনি এই নীতির শর্তাবলি গ্রহণ করছেন।
          </p>
        </div>

        {/* Content sections */}
        <div className="mt-8 space-y-8">
          {/* Section 1: Information Collection */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <UserCheck className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">১. আমরা কোন তথ্য সংগ্রহ করি</h2>
            </div>

            <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-600">
              <p>আমরা শুধুমাত্র সেবামূলক ও লেনদেন সম্পন্ন করার উদ্দেশ্যে প্রয়োজনীয় তথ্য সংগ্রহ করি:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-slate-800">ব্যক্তিগত পরিচিতি তথ্য:</strong> আপনার নাম, ইমেইল অ্যাড্রেস এবং মোবাইল ফোন নম্বর (অ্যাকাউন্ট তৈরি এবং অর্ডার ডেলিভারির জন্য)।
                </li>
                <li>
                  <strong className="text-slate-800">পেমেন্ট ও লেনদেন সংক্রান্ত তথ্য:</strong> ম্যানুয়াল পেমেন্ট (bKash, Nagad, Rocket) ভেরিফিকেশনের জন্য আপনার প্রদত্ত ট্রানজ্যাকশন আইডি (TrxID) এবং প্রেরকের মোবাইল নম্বর।
                </li>
                <li>
                  <strong className="text-slate-800">ডিভাইস ও ব্রাউজিং তথ্য:</strong> আপনার আইপি অ্যাড্রেস (IP Address), ব্রাউজার টাইপ, অপারেটিং সিস্টেম এবং ভিজিট করা পেজ সংক্রান্ত ডেটা যা নিরাপত্তা ও ইউজার এক্সপেরিয়েন্স উন্নয়নের জন্য সংগৃহীত হয়।
                </li>
              </ul>
              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  <strong>গুরুত্বপূর্ণ:</strong> আমরা কখনোই আপনার bKash, Nagad, Rocket বা ব্যাংক অ্যাকাউন্টের পিন (PIN), ওটিপি (OTP) বা পাসওয়ার্ড সংরক্ষণ বা সংগ্রহ করি না।
                </span>
              </div>
            </div>
          </section>

          {/* Section 2: How We Use Information */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">২. তথ্যের ব্যবহারের উদ্দেশ্য</h2>
            </div>

            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
              <p>সংগৃহীত তথ্য নিম্নলিখিত নির্দিষ্ট উদ্দেশ্যে ব্যবহার করা হয়:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>আপনার ক্রয়কৃত ডিজিটাল প্রোডাক্ট (কোর্স, সফটওয়্যার, পিডিএফ বা রিসোর্স)-এর ইনস্ট্যান্ট অ্যাক্সেস প্রদান করা।</li>
                <li>ম্যানুয়াল পেমেন্ট স্টেটমেন্টের সাথে ট্রানজ্যাকশন আইডি যাচাই ও নিশ্চিত করা।</li>
                <li>অর্ডার রিসিট, অ্যাকাউন্ট রিকভারি এবং গুরুত্বপূর্ণ সার্ভিস নোটিফিকেশন পাঠানো।</li>
                <li>গ্রাহক সেবা ও টেকনিক্যাল সাপোর্ট প্রদান করা।</li>
                <li>প্রতারণামূলক লেনদেন এবং অননুমোদিত অ্যাক্সেস প্রতিরোধ করা।</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Cookies and Tracking */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Cookie className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">৩. কুকিজ এবং ট্র্যাকিং প্রযুক্তি</h2>
            </div>

            <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-600">
              <p>
                আমরা সাইটের কার্যকারিতা উন্নত করা, বিশ্লেষণ এবং মার্কেটিং পারফরম্যান্স পরিমাপের জন্য কুকিজ এবং আধুনিক ট্র্যাকিং টুল ব্যবহার করি:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-slate-800">Google Analytics 4 ও Google Tag Manager:</strong> ভিজিটরদের সাইট ব্যবহার পদ্ধতি বিশ্লেষণ ও পরিসংখ্যান সংগ্রহে ব্যবহৃত হয়।
                </li>
                <li>
                  <strong className="text-slate-800">Meta Pixel এবং Conversions API (CAPI):</strong> মেটা (ফেসবুক/ইনস্টাগ্রাম) বিজ্ঞাপনের কার্যকারিতা এবং পারচেজ কনভার্সন সঠিকভাবে ট্র্যাক করতে ব্রাউজার এবং সুরক্ষিত সার্ভার-সাইড ট্র্যাকিং ব্যবহৃত হয়।
                </li>
                <li>
                  <strong className="text-slate-800">TikTok Pixel এবং Events API:</strong> টিকটক বিজ্ঞাপন ক্যাম্পেইনের পারফরম্যান্স মূল্যায়নে ব্যবহৃত হয়।
                </li>
                <li>
                  <strong className="text-slate-800">Microsoft Clarity:</strong> ব্যবহারকারীর স্বাচ্ছন্দ্য বজায় রাখতে হিটম্যাপ ও সেশন অ্যানালাইসিস করতে সাহায্য করে।
                </li>
              </ul>
              <p>
                আমরা আন্তর্জাতিক মানদণ্ড অনুসরণ করে <strong>Google Consent Mode v2</strong> বাস্তবায়ন করেছি। আপনি আমাদের কুকি ব্যানারের মাধ্যমে যেকোনো সময় আপনার পছন্দ নির্ধারণ করতে পারেন। বিস্তারিত জানতে আমাদের{' '}
                <Link href="/cookie-policy" className="font-semibold text-brand-600 hover:underline">
                  কুকি নীতি (Cookie Policy)
                </Link>{' '}
                দেখুন।
              </p>
            </div>
          </section>

          {/* Section 4: Data Security */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Lock className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">৪. তথ্যের নিরাপত্তা ও সংরক্ষণ</h2>
            </div>

            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
              <p>
                আপনার তথ্যের সর্বোচ্চ নিরাপত্তা বজায় রাখতে আমরা ইন্ডাস্ট্রি-স্ট্যান্ডার্ড ব্যবস্থা গ্রহণ করি:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>আমাদের সমস্ত ডেটা ট্রান্সমিশন আধুনিক SSL/TLS এনক্রিপশনের মাধ্যমে সুরক্ষিত।</li>
                <li>পাসওয়ার্ড সুরক্ষিত হ্যাশিং অ্যালগরিদমের মাধ্যমে সংরক্ষিত হয়, যা কোনো অ্যাডমিন বা কর্মীর দেখার সুযোগ নেই।</li>
                <li>অ্যাডমিন প্যানেলে যেকোনো অ্যাকশন বা পরিবর্তনের জন্য সম্পূর্ণ অডিট লগিং ব্যবস্থা চালু রয়েছে।</li>
                <li>আমরা কখনোই আপনার ব্যক্তিগত তথ্য কোনো থার্ড-পার্টি বা তৃতীয় পক্ষের কাছে বিক্রি, ভাড়া বা অননুমোদিতভাবে শেয়ার করি না।</li>
              </ul>
            </div>
          </section>

          {/* Section 5: User Rights */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <UserCheck className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">৫. আপনার অধিকারসমূহ</h2>
            </div>

            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
              <p>আমাদের ব্যবহারকারী হিসেবে আপনার রয়েছে নিম্নোক্ত অধিকারসমূহ:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>আপনার অ্যাকাউন্টের প্রোফাইল তথ্য দেখার ও হালনাগাদ করার অধিকার।</li>
                <li>অর্ডার হিস্ট্রি ও অ্যাক্টিভ পারচেজ এক্সেস যাচাই করার অধিকার।</li>
                <li>মার্কেটিং কুকি বা অ্যানালিটিক্স ডেটা সংগ্রহের সম্মতি পরিবর্তন বা প্রত্যাহারের অধিকার।</li>
                <li>আপনার অ্যাকাউন্ট ও সংশ্লিষ্ট তথ্য স্থায়ীভাবে মুছে ফেলার (Account Deletion) আবেদন করার অধিকার।</li>
              </ul>
            </div>
          </section>

          {/* Section 6: Contact Information */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">৬. যোগাযোগ ও সহায়তা</h2>
            </div>

            <p className="mt-4 text-sm text-slate-600">
              গোপনীয়তা নীতি সম্পর্কে যেকোনো জিজ্ঞাসা বা আপনার ডেটা সংক্রান্ত কোনো প্রশ্ন থাকলে সরাসরি আমাদের সাথে যোগাযোগ করতে পারেন:
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {s.contactEmail && (
                <a
                  href={`mailto:${s.contactEmail}`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 transition-colors hover:border-brand-500 hover:bg-brand-50/40"
                >
                  <Mail className="h-5 w-5 text-brand-600" />
                  <div>
                    <p className="text-xs text-slate-500">ইমেইল সাপোর্ট</p>
                    <p className="text-sm font-semibold text-slate-900">{s.contactEmail}</p>
                  </div>
                </a>
              )}
              {s.phone && (
                <a
                  href={`tel:${s.phone}`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 transition-colors hover:border-brand-500 hover:bg-brand-50/40"
                >
                  <Phone className="h-5 w-5 text-brand-600" />
                  <div>
                    <p className="text-xs text-slate-500">ফোন সহায়তা</p>
                    <p className="text-sm font-semibold text-slate-900">{s.phone}</p>
                  </div>
                </a>
              )}
              {s.whatsapp && (
                <a
                  href={`https://wa.me/${s.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 transition-colors hover:border-brand-500 hover:bg-brand-50/40"
                >
                  <MessageSquare className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-xs text-slate-500">WhatsApp হেল্পলাইন</p>
                    <p className="text-sm font-semibold text-slate-900">{s.whatsapp}</p>
                  </div>
                </a>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
