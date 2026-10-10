import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { getSettings } from '@/lib/settings';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(SITE),
    title: { default: `${s.siteName} | ${s.tagline}`, template: `%s | ${s.siteName}` },
    description: s.tagline,
    icons: s.faviconUrl ? { icon: s.faviconUrl } : undefined,
    openGraph: { siteName: s.siteName, type: 'website' },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <body className="bg-white text-ink antialiased">
        <Providers>
          <Navbar siteName={s.siteName} logoUrl={s.logoUrl} />
          <main>{children}</main>
          <Footer s={s} />
        </Providers>
        {s.gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${s.gaId}`} strategy="afterInteractive" />
            <Script id="ga" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${s.gaId.replace(/[^A-Za-z0-9-]/g, '')}');`}</Script>
          </>
        )}
      </body>
    </html>
  );
}