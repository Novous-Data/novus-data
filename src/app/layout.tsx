import type { Metadata } from 'next';
import { Inter, Source_Serif_4 } from 'next/font/google';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { publication } from '@/config/publication';
import { env } from '@/lib/env';

import './globals.css';

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-source-serif',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  // Resolved from NEXT_PUBLIC_SITE_URL, then $VERCEL_URL, then localhost, so
  // preview deployments still emit correct absolute URLs.
  metadataBase: new URL(env.siteUrl),
  title: {
    default: publication.name,
    template: `%s — ${publication.name}`,
  },
  description: publication.description,
  applicationName: publication.name,
  openGraph: {
    type: 'website',
    siteName: publication.name,
    title: publication.name,
    description: publication.description,
    url: '/',
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    title: publication.name,
    description: publication.description,
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${sourceSerif.variable} ${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-ink text-fg">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-link focus:bg-surface focus:px-4 focus:py-3 focus:text-fg"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
