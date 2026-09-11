'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useState } from 'react';

import { primaryNav } from '@/config/nav';

/**
 * The site's only client component.
 *
 * It is a client component for two reasons: the mobile menu is a disclosure
 * that has to open and close, and `aria-current` needs the active pathname,
 * which server components cannot read. Everything else on the site renders on
 * the server.
 */
export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [navigatedFrom, setNavigatedFrom] = useState(pathname);
  const panelId = useId();

  // Close the menu after navigating. Client-side navigation keeps this
  // component mounted, so without this the panel would stay open on the new
  // page. Adjusting state during render — rather than in an effect — is the
  // documented way to reset state when a prop-like value changes, and avoids
  // the extra render pass an effect would cost.
  if (pathname !== navigatedFrom) {
    setNavigatedFrom(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <nav aria-label="Primary" className="hidden md:block">
        <ul className="flex items-center gap-7">
          {primaryNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={clsx(
                  'inline-block py-2 text-[0.9375rem] transition-colors',
                  isActive(item.href)
                    ? 'text-fg underline decoration-accent decoration-2 underline-offset-[0.45em]'
                    : 'text-muted hover:text-fg',
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="-mr-2 inline-flex min-h-11 min-w-11 items-center gap-2 px-2 text-[0.9375rem] text-fg md:hidden"
      >
        <MenuIcon open={open} />
        {open ? 'Close' : 'Menu'}
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full z-20 border-b border-hairline bg-ink md:hidden"
      >
        <nav aria-label="Primary, mobile">
          <ul className="flex flex-col px-5 pb-4 sm:px-8">
            {primaryNav.map((item) => (
              <li key={item.href} className="border-t border-hairline first:border-t-0">
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={clsx(
                    'flex min-h-12 items-center text-[1.0625rem]',
                    isActive(item.href) ? 'text-fg' : 'text-muted',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}

/** Inline SVG, per the no-icon-library and no-emoji rules. */
function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
    >
      {open ? (
        <>
          <line x1="3" y1="3" x2="13" y2="13" />
          <line x1="13" y1="3" x2="3" y2="13" />
        </>
      ) : (
        <>
          <line x1="2" y1="4.5" x2="14" y2="4.5" />
          <line x1="2" y1="11.5" x2="14" y2="11.5" />
        </>
      )}
    </svg>
  );
}
