/**
 * Formatting for live readings. Pure, safe on the client.
 *
 * Deliberately NOT Intl.DateTimeFormat, unlike src/lib/format.ts. Those
 * helpers only ever run on the server; these also run in the browser, inside
 * client components that React hydrates against the server's HTML. Intl month
 * names come from the runtime's ICU data, and Node and a browser can disagree
 * — "Sep" against "Sept" for en-GB is a real, current difference — which is a
 * hydration mismatch on every timestamp on the page. Building the string by
 * hand from UTC fields gives both sides the same text by construction.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function parse(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "22 Sep 2026 15:15 UTC". Always UTC, always the same on server and client. */
export function formatUtc(iso: string): string {
  const date = parse(iso);
  if (!date) return 'unknown time';
  return `${pad(date.getUTCDate())} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
}

/** "22 Sep 15:15" — for axis ends and dense lists, where the year is noise. */
export function formatUtcShort(iso: string): string {
  const date = parse(iso);
  if (!date) return '—';
  return `${pad(date.getUTCDate())} ${MONTHS[date.getUTCMonth()]} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

/** "22 Sep 2026" — for hazard windows, where the hour is not meaningful. */
export function formatUtcDate(iso: string): string {
  const date = parse(iso);
  if (!date) return '—';
  return `${pad(date.getUTCDate())} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** "28,904". Hand-rolled for the same reason as the dates: locale grouping differs. */
export function formatCount(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * An age in words: "4 min", "2 h 10 min", "3 days". Coarsens as it grows,
 * because "4,312 min" is precise and useless.
 */
export function formatAge(minutes: number): string {
  const m = Math.max(0, Math.floor(minutes));
  if (m < 1) return 'under a minute';
  if (m < 60) return `${m} min`;
  const hours = Math.floor(m / 60);
  if (hours < 24) {
    const rest = m % 60;
    return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
  }
  const days = Math.floor(hours / 24);
  return days === 1 ? '1 day' : `${days} days`;
}

/**
 * A share of coverage as a percentage, to a precision that means something at
 * its size. GDELT shares are small — tenths or hundredths of a per cent — so a
 * fixed two decimals would print most of them as "0.00%".
 */
export function formatShare(percent: number): string {
  if (percent === 0) return '0%';
  if (percent >= 10) return `${percent.toFixed(1)}%`;
  if (percent >= 1) return `${percent.toFixed(2)}%`;
  return `${percent.toPrecision(2)}%`;
}
