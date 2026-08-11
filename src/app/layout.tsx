import { Lato, Oswald } from 'next/font/google';
import '@/app/globals.css';
import { ViewTransitions } from 'next-view-transitions';
import { initViewportScale } from '@/lib/viewportScale';
import GoogleAnalytics from '@/components/Analytics/GoogleAnalytics';
import PurchaseTracker from '@/components/Analytics/PurchaseTracker';

const oswald = Oswald({
  variable: '--font-oswald',
  subsets: ['latin'],
  weight: ['600', '700'],
});

const lato = Lato({
  variable: '--font-lato',
  subsets: ['latin'],
  weight: ['400', '700', '900'],
});

export const metadata = {
  title: 'Ph Film & Media',
  appleWebApp: {
    title: 'PH Film',
  },
  icons: {
    icon: '/icon1.png',
    apple: '/apple-icon.png',
    other: [{ rel: 'mask-icon', url: '/icon0.svg', color: '#fff' }],
  },
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#ffffff',
};

// Serialized to run inline pre-paint; initViewportScale must stay self-contained.
const viewportScaleScript = `(${initViewportScale})()`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewTransitions>
      {/* --sw is set on <html> pre-paint, so suppress the style attribute mismatch. */}
      <html lang='sv' suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: viewportScaleScript }} />
        </head>
        <body
          className={`grid lg:grid-cols-12 lg:grid-rows-6 lg:gap-x-p-desktop lg:h-screen lg:overflow-hidden antialiased ${lato.variable} ${oswald.variable}`}
        >
          {children}
          <GoogleAnalytics />
          <PurchaseTracker />
        </body>
      </html>
    </ViewTransitions>
  );
}
