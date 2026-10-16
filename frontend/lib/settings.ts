import { sget } from './server-api';
import type { Settings } from '@/types';

export const FALLBACK_SETTINGS: Settings = {
  siteName: 'Neuromark.shop', tagline: 'Premium courses, PDFs, apps and digital products', logoUrl: '', faviconUrl: '', contactEmail: '', phone: '', whatsapp: '',
  facebook: '', telegram: '', footerText: '', currency: 'BDT', gaId: 'G-FJ2FT7KQ72',
  gtmId: 'GTM-P6BZNSRB', metaPixelId: '1095038606461734', tiktokPixelId: '', clarityId: '',
  metaAccessToken: 'EAAPaFZCcU6nABSirYw3gIglEmqwedTy83OsO8tvJ3Kset17HWmwARFgeYmPvVNE2bmBQr1wDunK24ZBv3OnsTmprHlXSYE9sRKl4ASoctNiTzG3ZAycfuwAY2tsWEe2ZB14ZBs3vbkDBEaOMFziXrHHPOgGjf6cEOh9wlBwKeKDfFDrWUHeS11rDRZBfUwRl9VKAZDZD', tiktokAccessToken: '', gaMeasurementSecret: '', googleAdsId: '', googleAdsConversionLabel: '',
  payment: { instantAccess: true, note: '', methods: [] },
  homepage: {
    heroTitle: 'Learn, build and grow with premium digital products',
    heroSubtitle: 'Courses, guides, tools and premium apps. Pay securely and get instant access once your payment is verified.',
    whyChoose: [], faqs: [], showFeatured: true, showCourses: true, showApps: true, showResources: true,
  },
};

export const getSettings = async () => (await sget<Settings>('/settings', 120)) ?? FALLBACK_SETTINGS;
