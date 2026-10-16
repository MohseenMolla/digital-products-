import { z } from 'zod';
import { ACCESS_TYPES, PRODUCT_TYPES } from '../models/Product';

export const phoneRegex = /^(?:\+?88)?01[3-9]\d{8}$/;
const phone = z.string().trim().regex(phoneRegex, 'Enter a valid Bangladeshi phone number (01XXXXXXXXX)');
const password = z.string().min(8, 'Password must be at least 8 characters').max(128);

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  phone,
  password,
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });
export const profileSchema = z.object({ name: z.string().trim().min(2).max(100), phone });
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export const checkoutSchema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product'),
  fullName: z.string().trim().min(2, 'Full name is required').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  phone,
  couponCode: z.string().trim().max(40).optional().or(z.literal('')),
  attribution: z.record(z.unknown()).optional(),
});

export const submitPaymentSchema = z.object({
  token: z.string().min(10).max(100),
  method: z.enum(['BKASH', 'NAGAD', 'ROCKET']),
  transactionId: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{4,30}$/, 'Enter the transaction ID exactly as in your confirmation SMS (letters and numbers only)'),
  senderNumber: phone,
});

const lesson = z.object({
  _id: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  title: z.string().trim().min(1, 'Lesson title is required'),
  videoUrl: z.string().trim().default(''),
  description: z.string().default(''),
  duration: z.string().default(''),
  resources: z.array(z.object({ name: z.string().trim().min(1), url: z.string().trim().url() })).default([]),
});
const courseModule = z.object({
  _id: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  title: z.string().trim().min(1, 'Module title is required'),
  lessons: z.array(lesson).default([]),
});

export const productSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z.string().trim().optional(),
  shortDescription: z.string().max(400).default(''),
  description: z.string().default(''),
  category: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional().or(z.literal('')),
  productType: z.enum(PRODUCT_TYPES),
  accessType: z.enum(ACCESS_TYPES),
  price: z.coerce.number().min(0),
  comparePrice: z.coerce.number().min(0).default(0),
  thumbnail: z.string().default(''),
  thumbnailPublicId: z.string().default(''),
  images: z.array(z.object({ url: z.string(), publicId: z.string() })).default([]),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  featured: z.boolean().default(false),
  bestseller: z.boolean().default(false),
  stockStatus: z.enum(['IN_STOCK', 'OUT_OF_STOCK']).default('IN_STOCK'),
  duration: z.coerce.number().int().min(0).default(0),
  downloadLimit: z.coerce.number().int().min(0).default(0),
  downloadExpiry: z.coerce.number().int().min(0).default(0),
  allowMultiplePurchases: z.boolean().default(false),
  content: z.string().default(''),
  pdfUrl: z.string().default(''),
  pdfPublicId: z.string().default(''),
  fileName: z.string().default(''),
  externalUrl: z.string().trim().default(''),
  appInstructions: z.string().default(''),
  features: z.array(z.string().trim().min(1)).default([]),
  whatYouGet: z.array(z.string().trim().min(1)).default([]),
  faqs: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).default([]),
  courseModules: z.array(courseModule).default([]),
  appCredentials: z.object({
    loginEmail: z.string().default(''),
    password: z.string().default(''),
    loginUrl: z.string().default(''),
    notes: z.string().default(''),
    expiresAt: z.string().nullable().optional(),
  }).default({}),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z.string().trim().optional(),
  description: z.string().default(''),
  order: z.coerce.number().default(0),
});

export const couponSchema = z.object({
  code: z.string().trim().min(3).max(40).transform((s) => s.toUpperCase()),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.coerce.number().positive(),
  minimumAmount: z.coerce.number().min(0).default(0),
  maximumDiscount: z.coerce.number().min(0).default(0),
  usageLimit: z.coerce.number().int().min(0).default(0),
  expiresAt: z.string().nullable().optional(),
  active: z.boolean().default(true),
}).refine((d) => d.type !== 'PERCENTAGE' || d.value <= 100, { message: 'Percentage cannot exceed 100', path: ['value'] });

export const couponValidateSchema = z.object({ code: z.string().trim().min(1), productId: z.string().regex(/^[a-f\d]{24}$/i) });

export const settingsSchema = z.object({
  siteName: z.string().min(1), tagline: z.string().default(''), logoUrl: z.string().default(''), faviconUrl: z.string().default(''),
  contactEmail: z.string().default(''), phone: z.string().default(''), whatsapp: z.string().default(''),
  facebook: z.string().default(''), telegram: z.string().default(''), footerText: z.string().default(''),
  currency: z.string().default('BDT'), gaId: z.string().default(''),
  gtmId: z.string().default(''), metaPixelId: z.string().default(''), tiktokPixelId: z.string().default(''), clarityId: z.string().default(''),
  metaAccessToken: z.string().default(''), tiktokAccessToken: z.string().default(''), gaMeasurementSecret: z.string().default(''),
  googleAdsId: z.string().default(''), googleAdsConversionLabel: z.string().default(''),
  payment: z.object({
    instantAccess: z.boolean(), note: z.string().default(''),
    methods: z.array(z.object({ key: z.enum(['BKASH', 'NAGAD', 'ROCKET']), label: z.string().min(1), number: z.string().trim().default(''), accountType: z.string().default('Send Money'), enabled: z.boolean() })).max(3),
  }),
  homepage: z.object({
    heroTitle: z.string(), heroSubtitle: z.string(),
    whyChoose: z.array(z.object({ title: z.string(), text: z.string() })),
    faqs: z.array(z.object({ question: z.string(), answer: z.string() })),
    showFeatured: z.boolean(), showCourses: z.boolean(), showApps: z.boolean(), showResources: z.boolean(),
  }),
});

export const approveSchema = z.object({ note: z.string().trim().max(300).default('') });
export const rejectSchema = z.object({ reason: z.string().trim().min(3, 'Please give a reason').max(300).default('Transaction could not be verified') });
export const revokeSchema = z.object({ reason: z.string().trim().min(3).default('Revoked by admin') });
export const adminUserSchema = z.object({
  name: z.string().trim().min(2).max(100), phone: z.string().trim().default(''),
  isActive: z.boolean(), role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']).optional(),
});
export const progressSchema = z.object({ lessonId: z.string().regex(/^[a-f\d]{24}$/i), completed: z.boolean().default(true) });

export const setPasswordSchema = z.object({ token: z.string().min(10).max(100), password: z.string().min(8, 'Password must be at least 8 characters').max(128) });

export const emailOnlySchema = z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email') });
export const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  token: z.string().min(20).max(100),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});
