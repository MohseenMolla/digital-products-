import { Schema, model, Types } from 'mongoose';

export const PRODUCT_TYPES = ['COURSE', 'PDF', 'PREMIUM_APP', 'DIGITAL_PRODUCT', 'SUBSCRIPTION', 'OTHER'] as const;
export const ACCESS_TYPES = ['DOWNLOAD', 'ONLINE', 'ACCOUNT', 'EXTERNAL', 'MIXED'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];
export type AccessType = (typeof ACCESS_TYPES)[number];

export interface ILesson {
  _id: Types.ObjectId;
  title: string;
  videoUrl: string;
  description: string;
  duration: string;
  resources: { name: string; url: string }[];
}
export interface ICourseModule { _id: Types.ObjectId; title: string; lessons: ILesson[]; }

export interface IProduct {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  category?: Types.ObjectId;
  productType: ProductType;
  price: number;
  comparePrice: number;
  thumbnail: string;
  thumbnailPublicId: string;
  images: { url: string; publicId: string }[];
  status: 'DRAFT' | 'PUBLISHED';
  featured: boolean;
  bestseller: boolean;
  stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK';
  accessType: AccessType;
  duration: number; // access duration in days, 0 = lifetime
  downloadLimit: number; // 0 = unlimited
  downloadExpiry: number; // days after purchase, 0 = never
  allowMultiplePurchases: boolean;
  content: string;
  pdfUrl: string;
  pdfPublicId: string;
  fileName: string;
  externalUrl: string;
  appInstructions: string;
  features: string[];
  whatYouGet: string[];
  faqs: { question: string; answer: string }[];
  courseModules: ICourseModule[];
  appCredentials: { loginEmail: string; passwordEnc: string; loginUrl: string; notes: string; expiresAt?: Date | null };
  ratingAvg: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>({
  title: { type: String, required: true },
  videoUrl: { type: String, default: '' },
  description: { type: String, default: '' },
  duration: { type: String, default: '' },
  resources: [{ _id: false, name: String, url: String }],
});
const moduleSchema = new Schema<ICourseModule>({
  title: { type: String, required: true },
  lessons: [lessonSchema],
});

const schema = new Schema<IProduct>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    shortDescription: { type: String, default: '' },
    description: { type: String, default: '' },
    category: { type: Schema.Types.ObjectId, ref: 'Category', index: true },
    productType: { type: String, enum: PRODUCT_TYPES, required: true },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, default: 0, min: 0 },
    thumbnail: { type: String, default: '' },
    thumbnailPublicId: { type: String, default: '' },
    images: [{ _id: false, url: String, publicId: String }],
    status: { type: String, enum: ['DRAFT', 'PUBLISHED'], default: 'DRAFT' },
    featured: { type: Boolean, default: false },
    bestseller: { type: Boolean, default: false },
    stockStatus: { type: String, enum: ['IN_STOCK', 'OUT_OF_STOCK'], default: 'IN_STOCK' },
    accessType: { type: String, enum: ACCESS_TYPES, default: 'ONLINE' },
    duration: { type: Number, default: 0, min: 0 },
    downloadLimit: { type: Number, default: 0, min: 0 },
    downloadExpiry: { type: Number, default: 0, min: 0 },
    allowMultiplePurchases: { type: Boolean, default: false },
    content: { type: String, default: '' },
    pdfUrl: { type: String, default: '' },
    pdfPublicId: { type: String, default: '' },
    fileName: { type: String, default: '' },
    externalUrl: { type: String, default: '' },
    appInstructions: { type: String, default: '' },
    features: [String],
    whatYouGet: [String],
    faqs: [{ _id: false, question: String, answer: String }],
    courseModules: [moduleSchema],
    appCredentials: {
      loginEmail: { type: String, default: '' },
      passwordEnc: { type: String, default: '' },
      loginUrl: { type: String, default: '' },
      notes: { type: String, default: '' },
      expiresAt: { type: Date, default: null },
    },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);
schema.index({ status: 1, productType: 1, createdAt: -1 });
schema.index({ status: 1, featured: 1 });

export const Product = model<IProduct>('Product', schema);
