/**
 * A numbered citation list.
 *
 * Extracted from the register entry page when the entity pages needed the same
 * thing: the exact format a citation is rendered in is part of the site's claim
 * to be checkable, so it should not be reimplemented per page and allowed to
 * drift.
 *
 * Each citation is a line of running text with a link inside it, so the link is
 * inline prose rather than a standalone control — which is why it is marked up
 * as a paragraph and not padded out to a 44px target.
 */

import { ExternalLink } from '@/components/text-link';
import type { Source } from '@/lib/disruptions/types';
import { formatShortDate } from '@/lib/format';

export function SourceList({
  sources,
  className,
  compact,
}: {
  sources: Source[];
  className?: string;
  compact?: boolean;
}) {
  return (
    <ol className={className}>
      {sources.map((source, index) => (
        <li key={source.url} className={compact ? undefined : 'border-t border-hairline py-3'}>
          <p className={compact ? 'text-[0.8125rem] leading-relaxed' : undefined}>
            <span data-numeric className="mr-2 text-muted">
              {index + 1}.
            </span>
            <ExternalLink href={source.url}>{source.title}</ExternalLink>
            <span className="text-muted">
              {' '}
              — {source.publisher}
              {source.retrievedAt && formatShortDate(source.retrievedAt)
                ? `, read ${formatShortDate(source.retrievedAt)}`
                : ''}
            </span>
          </p>
        </li>
      ))}
    </ol>
  );
}
