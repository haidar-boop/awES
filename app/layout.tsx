import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SiteHeader } from './components/SiteHeader';
import { SiteFooter } from './components/SiteFooter';
import { MobileTabBar } from './components/MobileTabBar';
import { siteUrl } from '@/lib/utils';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: 'PennyRadar Canada — Live Penny List & Hidden Clearance Finder',
    template: '%s · PennyRadar Canada',
  },
  description:
    'Community-powered penny deals ($0.01 register finds) and hidden clearance at Home Depot Canada, Walmart Canada, Dollar Tree and more. Live list, UPC lookup, tag decoder, and area alerts.',
  alternates: {
    canonical: '/',
    languages: { 'en-CA': '/', 'fr-CA': '/' },
    types: { 'application/rss+xml': '/rss.xml' },
  },
  openGraph: {
    siteName: 'PennyRadar Canada',
    locale: 'en_CA',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: '#B87333',
};

const themeInit = `try{const t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-CA" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ? (
          <script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
          />
        ) : null}
      </head>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-penny-500 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
        <SiteFooter />
        <MobileTabBar />
      </body>
    </html>
  );
}
