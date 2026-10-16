'use client';
import { useEffect } from 'react';
import Script from 'next/script';
import { hasConsent, initConsentMode } from '@/lib/consent';
import { captureAttribution, storeAttribution } from '@/lib/attribution';

interface Props {
  metaPixelId: string;
  tiktokPixelId: string;
  clarityId: string;
}

export function TrackingScripts({ metaPixelId, tiktokPixelId, clarityId }: Props) {
  useEffect(() => {
    // Initialize consent mode from stored preferences
    initConsentMode();

    // Capture & store attribution data on first client render
    const attr = captureAttribution();
    if (attr) storeAttribution(attr);
  }, []);

  const marketingConsented = typeof window !== 'undefined' && hasConsent('marketing');
  const analyticsConsented = typeof window !== 'undefined' && hasConsent('analytics');

  return (
    <>
      {/* Meta Pixel */}
      {metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
          (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init','${metaPixelId}');
          fbq('track','PageView');
        `}</Script>
      )}

      {/* TikTok Pixel */}
      {tiktokPixelId && (
        <Script id="tiktok-pixel" strategy="afterInteractive">{`
          !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
          ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group",
          "enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
          ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
          for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
          ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
          ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;
          ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e+\"_\"+o]=1;
          var s=d.createElement("script");s.type="text/javascript";s.async=!0;s.src=r+"?sdkid="+e+"&lib="+t;
          var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(s,a)};
          ttq.load('${tiktokPixelId}');ttq.page()}(window,document,'ttq');
        `}</Script>
      )}

      {/* Microsoft Clarity */}
      {clarityId && (
        <Script id="clarity" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})
          (window,document,"clarity","script","${clarityId}");
        `}</Script>
      )}
    </>
  );
}
