export type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export interface User { id: string; name: string; email: string; phone: string; role: Role; mustChangePassword: boolean; }
export interface Category { id: string; name: string; slug: string; description: string; order: number; }
export type ProductType = 'COURSE' | 'PDF' | 'PREMIUM_APP' | 'DIGITAL_PRODUCT' | 'SUBSCRIPTION' | 'OTHER';
export interface Product {
  id: string; title: string; slug: string; shortDescription: string; description: string;
  category?: { name: string; slug: string } | null; productType: ProductType;
  price: number; comparePrice: number; discountPercent: number; thumbnail: string; images: string[];
  featured: boolean; bestseller: boolean; stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK'; accessType: string;
  duration: number; downloadLimit: number; features: string[]; whatYouGet: string[];
  faqs: { question: string; answer: string }[];
  courseModules: { id: string; title: string; lessons: { id: string; title: string; duration: string }[] }[];
  ratingAvg: number; ratingCount: number;
}
export interface Paged<T> { items: T[]; page: number; limit: number; total: number; pages: number; }
export interface Settings {
  siteName: string; tagline: string; logoUrl: string; faviconUrl: string; contactEmail: string; phone: string;
  whatsapp: string; facebook: string; telegram: string; footerText: string; currency: string; gaId: string;
  payment: { instantAccess: boolean; note: string; methods: { key: 'BKASH' | 'NAGAD' | 'ROCKET'; label: string; number: string; accountType: string; enabled: boolean }[] };
  homepage: {
    heroTitle: string; heroSubtitle: string; whyChoose: { title: string; text: string }[];
    faqs: { question: string; answer: string }[]; showFeatured: boolean; showCourses: boolean; showApps: boolean; showResources: boolean;
  };
}
export interface PurchaseItem {
  id: string; productId: string; title: string; slug: string; thumbnail: string; productType: ProductType; accessType: string;
  accessStatus: 'ACTIVE' | 'EXPIRED' | 'REVOKED'; purchasedAt: string; expiresAt: string | null; downloadCount: number;
  orderNumber?: string; paymentStatus?: string; amount?: number;
}
export interface OrderRow {
  _id: string; orderNumber: string; customerName: string; customerEmail: string; customerPhone: string;
  productTitleSnapshot: string; amount: number; paymentMethod?: string; transactionId?: string; paymentStatus: string;
  orderStatus: string; createdAt: string;
}
