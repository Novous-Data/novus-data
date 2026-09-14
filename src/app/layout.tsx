import type { Metadata } from 'next';
import { Inter, Source_Serif_4 } from 'next/font/google';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
// Imported for its side effect: refuses a production build while a
// launch-critical fact is still missing. Server-only by design.
import '@/config/input-ledger';
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
        {/* Feed discovery, declared as an element rather than through
            `metadata.alternates.types`.

            Next merges metadata per top-level field, so a page that sets its
            own `alternates` — and every page here sets `canonical` — replaces
            the layout's `alternates` object wholesale and drops `types` with
            it. Declared in the layout's tree instead, React hoists it into
            <head> on every route, which is what "site-wide" has to mean. */}
        <link
          rel="alternate"
          type="application/feed+json"
          href="/register.json"
          title="Novus Data — disruption register"
        />
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
