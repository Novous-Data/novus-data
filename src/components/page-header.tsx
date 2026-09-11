import type { ReactNode } from 'react';

import { Container } from '@/components/container';

/**
 * The standard opening for an interior page: one h1, and an optional single
 * line of lede. No rule beneath it — a rule under every page title is
 * decoration, and the brand rules reserve rules for dividing real things.
 */
export function PageHeader({
  title,
  lede,
  eyebrow,
}: {
  title: string;
  lede?: ReactNode;
  /** Used only where it carries information, such as an issue number. */
  eyebrow?: ReactNode;
}) {
  return (
    <Container className="pt-14 sm:pt-20">
      {eyebrow ? <p className="mb-4 text-meta text-muted">{eyebrow}</p> : null}
      <h1 className="max-w-[20ch] font-serif text-title font-semibold text-fg">{title}</h1>
      {lede ? (
        <div className="mt-5 max-w-reading text-subhead text-muted">{lede}</div>
      ) : null}
    </Container>
  );
}
