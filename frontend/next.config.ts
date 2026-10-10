import type { NextConfig } from 'next';

const backend = process.env.BACKEND_URL ?? 'http://localhost:5000';

const config: NextConfig = {
  poweredByHeader: false,
  images: { remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }] },
  // The browser talks to /api on the frontend origin; Next proxies to the Express backend.
  // This keeps the auth cookie first-party (SameSite=Lax) in production.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${backend}/api/:path*` }];
  },
};
export default config;
