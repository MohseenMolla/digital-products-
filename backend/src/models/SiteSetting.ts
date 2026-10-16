import { Schema, model } from 'mongoose';

export interface ISiteSetting {
  key: string;
  siteName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  contactEmail: string;
  phone: string;
  whatsapp: string;
  facebook: string;
  telegram: string;
  footerText: string;
  currency: string;
  gaId: string;
  gtmId: string;
  metaPixelId: string;
  tiktokPixelId: string;
  clarityId: string;
  metaAccessToken: string;
  tiktokAccessToken: string;
  gaMeasurementSecret: string;
  googleAdsId: string;
  googleAdsConversionLabel: string;
  payment: {
    instantAccess: boolean;
    note: string;
    methods: { key: 'BKASH' | 'NAGAD' | 'ROCKET'; label: string; number: string; accountType: string; enabled: boolean }[];
  };
  homepage: {
    heroTitle: string;
    heroSubtitle: string;
    whyChoose: { title: string; text: string }[];
    faqs: { question: string; answer: string }[];
    showFeatured: boolean;
    showCourses: boolean;
    showApps: boolean;
    showResources: boolean;
  };
}

const schema = new Schema<ISiteSetting>(
  {
    key: { type: String, default: 'main', unique: true },
    siteName: { type: String, default: 'Neuromark.shop' },
    tagline: { type: String, default: 'Premium courses, PDFs, apps and digital products' },
    logoUrl: { type: String, default: '' },
    faviconUrl: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    facebook: { type: String, default: '' },
    telegram: { type: String, default: '' },
    footerText: { type: String, default: '' },
    currency: { type: String, default: 'BDT' },
    gaId: { type: String, default: 'G-FJ2FT7KQ72' },
    gtmId: { type: String, default: 'GTM-P6BZNSRB' },
    metaPixelId: { type: String, default: '1095038606461734' },
    tiktokPixelId: { type: String, default: '' },
    clarityId: { type: String, default: '' },
    metaAccessToken: { type: String, default: 'EAAPaFZCcU6nABSirYw3gIglEmqwedTy83OsO8tvJ3Kset17HWmwARFgeYmPvVNE2bmBQr1wDunK24ZBv3OnsTmprHlXSYE9sRKl4ASoctNiTzG3ZAycfuwAY2tsWEe2ZB14ZBs3vbkDBEaOMFziXrHHPOgGjf6cEOh9wlBwKeKDfFDrWUHeS11rDRZBfUwRl9VKAZDZD' },
    tiktokAccessToken: { type: String, default: '' },
    gaMeasurementSecret: { type: String, default: '' },
    googleAdsId: { type: String, default: '' },
    googleAdsConversionLabel: { type: String, default: '' },
    payment: {
      instantAccess: { type: Boolean, default: true },
      note: { type: String, default: '' },
      methods: {
        type: [{ _id: false, key: { type: String, enum: ['BKASH', 'NAGAD', 'ROCKET'] }, label: String, number: { type: String, default: '' }, accountType: { type: String, default: 'Send Money' }, enabled: { type: Boolean, default: true } }],
        default: () => [
          { key: 'BKASH', label: 'bKash', number: '', accountType: 'Send Money', enabled: true },
          { key: 'NAGAD', label: 'Nagad', number: '', accountType: 'Send Money', enabled: true },
          { key: 'ROCKET', label: 'Rocket', number: '', accountType: 'Send Money', enabled: true },
        ],
      },
    },
    homepage: {
      heroTitle: { type: String, default: 'Learn, build and grow with premium digital products' },
      heroSubtitle: { type: String, default: 'Courses, guides, tools and premium apps. Pay securely and get instant access once your payment is verified.' },
      whyChoose: {
        type: [{ _id: false, title: String, text: String }],
        default: [
          { title: 'Instant access', text: 'Your product unlocks automatically after payment verification.' },
          { title: 'Verified payments', text: 'Every transaction ID is checked and can only be used once.' },
          { title: 'Protected content', text: 'Files and lessons are delivered only to the people who bought them.' },
          { title: 'Real support', text: 'Reach us on WhatsApp or email whenever you need help.' },
        ],
      },
      faqs: {
        type: [{ _id: false, question: String, answer: String }],
        default: [
          { question: 'How do I get my product after paying?', answer: 'Once your payment is verified, the product appears in your dashboard under My Purchases.' },
          { question: 'Which payment methods are supported?', answer: 'bKash, Nagad and Rocket (Send Money). After sending, you submit your transaction ID.' },
          { question: 'What if my payment is deducted but I have no access?', answer: 'Verification can take a minute. If access does not appear, contact support with your order number.' },
        ],
      },
      showFeatured: { type: Boolean, default: true },
      showCourses: { type: Boolean, default: true },
      showApps: { type: Boolean, default: true },
      showResources: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

export const SiteSetting = model<ISiteSetting>('SiteSetting', schema);