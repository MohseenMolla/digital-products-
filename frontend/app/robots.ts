import type { MetadataRoute } from 'next';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/dashboard', '/checkout', '/payment', '/order', '/recover', '/forgot-password', '/reset-password', '/api'] }], sitemap: `${SITE}/sitemap.xml` };
}
