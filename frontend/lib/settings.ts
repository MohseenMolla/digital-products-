import { sget } from './server-api';
import type { Settings } from '@/types';

export const FALLBACK_SETTINGS: Settings = {
  siteName: 'Neuoro-it', tagline: 'Premium courses, PDFs, apps and digital products', logoUrl: '', faviconUrl: '', contactEmail: '', phone: '', whatsapp: '',
  facebook: '', telegram: '', footerText: '', currency: 'BDT', gaId: '',
  payment: { instantAccess: true, note: '', methods: [] },
  homepage: {
    heroTitle: 'Learn, build and grow with premium digital products',
    heroSubtitle: 'Courses, guides, tools and premium apps. Pay securely and get instant access once your payment is verified.',
    whyChoose: [], faqs: [], showFeatured: true, showCourses: true, showApps: true, showResources: true,
  },
};

export const getSettings = async () => (await sget<Settings>('/settings', 120)) ?? FALLBACK_SETTINGS;
