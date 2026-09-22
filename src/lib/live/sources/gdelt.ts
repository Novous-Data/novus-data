/**
 * GDELT DOC 2.0 — how much of the world's news is about each disruption theme,
 * in fifteen-minute intervals over the past day, plus the latest headlines.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS SIGNAL IS, AND WHAT IT IS NOT
 *
 * It is a count of articles. It measures attention, not disruption: a spike
 * means the press is writing about port strikes, which is worth knowing and is
 * not the same as ports being shut. The page labels it "news volume" for that
 * reason, and the headlines beneath it are third-party reporting that Novus
 * Data has not verified. Neither ever feeds the register's assessments.
 *
 * ---------------------------------------------------------------------------
 * RATE LIMIT
 *
 * GDELT allows one request every five seconds per IP and answers faster
 * callers with HTTP 429. Requests are therefore made one at a time with a
 * gap, and a 429 costs one series for one cycle rather than failing the lot.
 * On Vercel the outbound IP is shared with other customers, so 429s can
 * happen regardless of our own pacing; the page reports them honestly as a
 * partial result rather than hiding them.
 *
 * Citation is a condition of use (see ../meta.ts) — the page carries it.
 * ---------------------------------------------------------------------------
 */

import type { GdeltData, Headline, Reading, SignalPoint, SignalSeries } from '../types';
import {
  LiveSourceError,
  asArray,
  fetchJson,
  isRecord,
  isoFromGdelt,
  latestIso,
  num,
  sleep,
  str,
  type FetchedJson,
} from './http';

const ENDPOINT = 'https://api.gdeltproject.org/api/v2/doc/doc';
const GAP_MS = 5_500;
const WINDOW = '24h';
const MAX_HEADLINES = 12;

export interface GdeltTheme {
  id: string;
  label: string;
  query: string;
}

/**
 * The themes tracked. Each is one request, so each costs five seconds of
 * regeneration time: add a theme only if it earns that.
 */
export const GDELT_THEMES: GdeltTheme[] = [
  {
    id: 'chokepoints',
    label: 'Chokepoints and canals',
    query: '("suez canal" OR "panama canal" OR "red sea shipping" OR "strait of hormuz")',
  },
  {
    id: 'ports-labour',
    label: 'Ports and labour',
    query: '("port strike" OR "dockworkers" OR "port congestion" OR "port closure")',
  },
  {
    id: 'trade-policy',
    label: 'Export controls and tariffs',
    query: '("export controls" OR "export ban" OR "rare earth exports" OR "tariff hike")',
  },
  {
    id: 'energy',
    label: 'Energy supply',
    query: '("oil supply" OR "refinery outage" OR "pipeline shutdown" OR "LNG supply")',
  },
];

const HEADLINE_QUERY =
  '("supply chain disruption" OR "shipping disruption" OR "port strike" OR "suez canal" OR "panama canal" OR "export controls")';

export interface GdeltRaw {
  series: Array<{ themeId: string; fetched: FetchedJson | null; error: string | null }>;
  headlines: { fetched: FetchedJson | null; error: string | null };
}

function url(query: string, extra: Record<string, string>): string {
  const params = new URLSearchParams({ query, timespan: WINDOW, format: 'json', ...extra });
  return `${ENDPOINT}?${params}`;
}

async function attempt(target: string): Promise<{ fetched: FetchedJson | null; error: string | null }> {
  try {
    return { fetched: await fetchJson(target, 'gdelt', { label: 'GDELT' }), error: null };
  } catch (error) {
    return {
      fetched: null,
      error: error instanceof LiveSourceError ? error.publicReason : 'GDELT could not be read.',
    };
  }
}

/** One request at a time, GAP_MS apart. See RATE LIMIT above. */
export async function fetchGdelt(): Promise<GdeltRaw> {
  const series: GdeltRaw['series'] = [];
  for (const [index, theme] of GDELT_THEMES.entries()) {
    if (index > 0) await sleep(GAP_MS);
    series.push({ themeId: theme.id, ...(await attempt(url(theme.query, { mode: 'timelinevolraw' }))) });
  }
  await sleep(GAP_MS);
  const headlines = await attempt(
    url(HEADLINE_QUERY, { mode: 'artlist', maxrecords: '75', sort: 'datedesc' }),
  );
  return { series, headlines };
}

function parseSeries(theme: GdeltTheme, body: unknown): SignalSeries | null {
  if (!isRecord(body)) return null;
  // timelinevolraw: { timeline: [ { series, data: [ { date, value, norm } ] } ] }
  const first = asArray(body.timeline).find(isRecord);
  if (!first) return null;

  const points: SignalPoint[] = asArray(first.data)
    .filter(isRecord)
    .map((point) => ({
      at: isoFromGdelt(point.date),
      articles: num(point.value),
      monitored: num(point.norm),
    }))
    .filter((p): p is SignalPoint => p.at !== null && p.articles !== null && p.monitored !== null)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  return points.length > 0 ? { themeId: theme.id, label: theme.label, points } : null;
}

function normaliseTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function parseHeadlines(body: unknown): Headline[] {
  if (!isRecord(body)) return [];
  const seen = new Set<string>();
  const headlines: Headline[] = [];

  for (const raw of asArray(body.articles)) {
    if (!isRecord(raw)) continue;
    // English only: a headline the reader cannot read is not information.
    if (str(raw.language) && str(raw.language) !== 'English') continue;

    const title = str(raw.title);
    const link = str(raw.url);
    const seenAt = isoFromGdelt(raw.seendate);
    if (!title || !link || !seenAt || !/^https?:\/\//i.test(link)) continue;

    // Syndicated copies of one story share a title; keep the first.
    const key = normaliseTitle(title);
    if (seen.has(key)) continue;
    seen.add(key);

    headlines.push({
      title,
      url: link,
      domain: str(raw.domain) ?? new URL(link).hostname,
      seenAt,
      sourceCountry: str(raw.sourcecountry),
    });
    if (headlines.length >= MAX_HEADLINES) break;
  }
  return headlines;
}

export function parseGdelt(raw: GdeltRaw): Reading<GdeltData> {
  const notes: string[] = [];
  const series: SignalSeries[] = [];

  for (const entry of raw.series) {
    const theme = GDELT_THEMES.find((t) => t.id === entry.themeId);
    if (!theme) continue;
    const parsed = entry.fetched ? parseSeries(theme, entry.fetched.body) : null;
    if (parsed) series.push(parsed);
    else notes.push(`${theme.label}: ${entry.error ?? 'no data for the past day'}`);
  }

  const headlines = raw.headlines.fetched ? parseHeadlines(raw.headlines.fetched.body) : [];
  if (!raw.headlines.fetched) notes.push(`Headlines: ${raw.headlines.error ?? 'unavailable'}`);

  if (series.length === 0 && headlines.length === 0) {
    // Every request failed. Report the failure itself, not prefixed with the
    // first theme's name — that would imply only one theme was affected.
    const first = raw.series.find((entry) => entry.error)?.error ?? raw.headlines.error;
    throw new LiveSourceError(first ?? 'GDELT returned no usable data.');
  }

  const asOf = latestIso([
    ...series.map((s) => s.points.at(-1)?.at ?? null),
    ...headlines.map((h) => h.seenAt),
  ]);
  if (!asOf) throw new LiveSourceError('GDELT data carried no usable timestamps.');

  return {
    status: 'ok',
    source: 'gdelt',
    asOf,
    asOfBasis: 'latest GDELT interval',
    data: { windowHours: 24, series, headlines },
    notes,
  };
}
