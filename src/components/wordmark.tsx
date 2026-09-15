import clsx from 'clsx';

import { publication } from '@/config/publication';

/**
 * The wordmark is typographic: Newsreader, semibold, tightened tracking.
 *
 * No logo file was supplied, and the existing Novus Data logo must not be
 * redrawn or approximated from memory. When the real file arrives it replaces
 * this component and the generated icons — see HANDOFF.md.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        'font-serif font-semibold tracking-[-0.012em] text-fg',
        className,
      )}
    >
      {publication.name}
    </span>
  );
}
