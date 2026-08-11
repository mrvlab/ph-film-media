'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

// Measurement ID is public — it ships in the page HTML either way.
const GA_MEASUREMENT_ID = 'G-Q30CGRHEZN';

// Only the live site reports: dev and Vercel previews stay out of the property.
const enabled =
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PUBLIC_VERCEL_ENV !== 'preview';

// Runs in the server-rendered HTML, so window.gtag exists before hydration —
// otherwise the first effects (view_item, view_item_list) call a gtag that
// isn't there yet and their events are lost. Calls made before the library
// finishes loading queue up in dataLayer and are processed on arrival.
const bootstrap = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`;

/**
 * Loads gtag.js site-wide. GA4's enhanced measurement picks up the App Router's
 * history-based navigations, so page views need no per-route wiring here.
 */
const GoogleAnalytics = () => {
  const pathname = usePathname();

  // The Studio is editor traffic, not visitors.
  if (!enabled || pathname.startsWith('/studio')) return null;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: bootstrap }} />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy='afterInteractive'
      />
    </>
  );
};

export default GoogleAnalytics;
