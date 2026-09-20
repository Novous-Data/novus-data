import { env } from '@/lib/env';

/**
 * A visible marker for a fact the author has not supplied yet.
 *
 * The alternative to a marker is inventing the fact, which Rule 1 forbids
 * outright. So where a page genuinely cannot be written without a value, it
 * says so in the layout instead of guessing — obvious in development and in
 * the review preview, and impossible in a real production build, because
 * publication.ts refuses to build while a launch-critical input is missing.
 */
export function NeedsInput({ label }: { label: string }) {
  return (
    <mark
      className="inline-block border border-dashed border-accent bg-surface px-1.5 py-0.5 align-baseline font-sans text-meta text-muted"
      title={
        env.isDevelopment
          ? 'Unfilled input. See INPUT_LEDGER in src/config/publication.ts.'
          : undefined
      }
    >
      Needs input: {label}
    </mark>
  );
}
