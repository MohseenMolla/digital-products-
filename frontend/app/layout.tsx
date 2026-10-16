import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { getSettings } from '@/lib/settings';
import { TrackingScripts } from '@/components/TrackingScripts';

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
  const sanitize = (v: string) => v.replace(/[^A-Za-z0-9-_]/g, '');
  const gtmId = s.gtmId ? sanitize(s.gtmId) : '';
  const gaId = s.gaId ? sanitize(s.gaId) : '';
  const metaPixelId = s.metaPixelId ? sanitize(s.metaPixelId) : '';
  const tiktokPixelId = s.tiktokPixelId ? sanitize(s.tiktokPixelId) : '';
  const clarityId = s.clarityId ? sanitize(s.clarityId) : '';

  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <head>
        {/* Google Consent Mode v2 — must load BEFORE any Google tag */}
        <Script id="consent-mode" strategy="beforeInteractive">{`
          window.dataLayer=window.dataLayer||[];
          function gtag(){dataLayer.push(arguments)}
          gtag('consent','default',{
            analytics_storage:'denied',
            functionality_storage:'denied',
            ad_storage:'denied',
            ad_user_data:'denied',
            ad_personalization:'denied',
            wait_for_update:500
          });
        `}</Script>

        {/* GTM Container */}
        {gtmId && (
          <Script id="gtm" strategy="afterInteractive">{`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');
          `}</Script>
        )}

        {/* Google tag (gtag.js) - GA4 */}
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">{`
              window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
              gtag('js',new Date());gtag('config','${gaId}');
            `}</Script>
          </>
        )}
      </head>
      <body className="bg-white text-ink antialiased">
        {/* GTM noscript fallback */}
        {gtmId && (
          <noscript><iframe src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`} height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} /></noscript>
        )}
        {/* Meta Pixel noscript fallback */}
        {metaPixelId && (
          <noscript><img height="1" width="1" style={{ display: 'none' }} src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`} alt="" /></noscript>
        )}
        <Providers>
          <Navbar siteName={s.siteName} logoUrl={s.logoUrl} />
          <main>{children}</main>
          <Footer s={s} />
        </Providers>
        {/* Client component that handles Meta Pixel, TikTok Pixel, Clarity, consent listener */}
        <TrackingScripts metaPixelId={metaPixelId} tiktokPixelId={tiktokPixelId} clarityId={clarityId} />
      </body>
    </html>
  );
}