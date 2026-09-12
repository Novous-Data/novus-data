import clsx from 'clsx';
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

const baseClasses =
  'text-link underline decoration-[color-mix(in_srgb,var(--accent-text)_45%,transparent)] decoration-1 underline-offset-[0.2em] transition-colors hover:decoration-[var(--accent-text)]';

/** Internal link, styled once so every link on the site matches. */
export function TextLink({
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { children: ReactNode }) {
  return (
    <Link className={clsx(baseClasses, className)} {...props}>
      {children}
    </Link>
  );
}

/**
 * A mail address. Deliberately not an ExternalLink: `mailto:` hands off to the
 * reader's mail client, so target="_blank" would leave an empty tab behind and
 * rel="noopener" means nothing.
 */
export function MailLink({
  email,
  className,
}: {
  email: string;
  className?: string;
}) {
  return (
    <a href={`mailto:${email}`} className={clsx(baseClasses, className)}>
      {email}
    </a>
  );
}

/** Outbound link. Always rel-hardened; never opens a tab silently. */
export function ExternalLink({
  className,
  children,
  ...props
}: ComponentProps<'a'> & { children: ReactNode }) {
  return (
    <a
      className={clsx(baseClasses, className)}
      rel="noopener noreferrer"
      target="_blank"
      {...props}
    >
      {children}
    </a>
  );
}
