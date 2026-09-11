/**
 * Formatting helpers shared by every page.
 *
 * Dates are the subtle hazard here. All formatting is done with an explicit
 * `timeZone: 'UTC'`, because without it the server formats in the server's
 * zone and the browser formats in the reader's, producing two different
 * strings for the same timestamp and a React hydration mismatch. The fix is
 * an explicit time zone, never `suppressHydrationWarning`.
 */

const LONG_DATE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * Two-digit day and short month, so archive rows align into a real column
 * when combined with tabular numerals: "07 Sep 2026".
 */
const SHORT_DATE = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "7 September 2026", or null if the timestamp is missing or unparseable. */
export function formatLongDate(iso: string | null | undefined): string | null {
  const date = parse(iso);
  return date ? LONG_DATE.format(date) : null;
}

/** "07 Sep 2026", or null. */
export function formatShortDate(iso: string | null | undefined): string | null {
  const date = parse(iso);
  return date ? SHORT_DATE.format(date) : null;
}

/** Four-digit year as a string, for grouping the archive. Null if unparseable. */
export function yearOf(iso: string | null | undefined): string | null {
  const date = parse(iso);
  return date ? String(date.getUTCFullYear()) : null;
}

/** A Date for sorting and for sitemap lastModified. Null if unparseable. */
export function toDate(iso: string | null | undefined): Date | null {
  return parse(iso);
}

/** "0007" — zero-padded issue number for column alignment. */
export function formatIssueNumber(issueNumber: number | null): string | null {
  if (issueNumber === null || !Number.isFinite(issueNumber)) return null;
  return String(Math.trunc(issueNumber)).padStart(4, '0');
}

/** Words per minute used for reading time. Conventional for prose. */
const WORDS_PER_MINUTE = 225;

/**
 * Reading time measured from the stored body. This is a real measurement of
 * real text, not a decorative statistic — which is why it returns null for an
 * empty body instead of a default, and why the issue page omits the field
 * entirely in that case.
 */
export function readingTimeMinutes(html: string | null): number | null {
  if (!html) return null;

  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length === 0) return null;

  const words = text.split(' ').filter(Boolean).length;
  if (words === 0) return null;

  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** Word count of stored body text. Used by /debug/content. */
export function wordCount(html: string | null): number {
  if (!html) return 0;
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length === 0 ? 0 : text.split(' ').length;
}
