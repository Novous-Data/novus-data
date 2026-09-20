import { SiteNav } from '@/components/site-nav';

/**
 * Not sticky, deliberately. A masthead that stays out of the way suits a
 * publication; a persistent bar suits an application. It also keeps the
 * reading column clear of a translucent overlay, which the brand rules out.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-hairline">
      <SiteNav />
    </header>
  );
}
