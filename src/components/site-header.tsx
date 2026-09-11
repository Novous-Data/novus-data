import Link from 'next/link';

import { Container } from '@/components/container';
import { SiteNav } from '@/components/site-nav';
import { Wordmark } from '@/components/wordmark';

/**
 * Not sticky, deliberately. A masthead that stays out of the way suits a
 * publication; a persistent bar suits an application. It also keeps the
 * reading column free of a translucent overlay, which the brand rules out.
 */
export function SiteHeader() {
  return (
    <header className="relative border-b border-hairline">
      <Container className="flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
        <Link href="/" className="inline-flex items-center py-2">
          <Wordmark className="text-[1.1875rem] sm:text-[1.25rem]" />
          <span className="sr-only">— home</span>
        </Link>
        <SiteNav />
      </Container>
    </header>
  );
}
