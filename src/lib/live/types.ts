/**
 * The live data layer — types and constants.
 *
 * Pure data, no side effects, no imports from ./sources. Safe to import from a
 * client component, which is why components take their labels from here rather
 * than from ../index.ts (the same split §6a keeps for the register).
 *
 * ---------------------------------------------------------------------------
 * THE ONE RULE THIS LAYER EXISTS TO ENFORCE
 *
 * A reading's age comes from a timestamp INSIDE the upstream data — the time
 * the feed says it was generated, the latest observation it contains — and
 * never from when our code happened to run.
 *
 * That is not pedantry. Every fetch here is cached for fifteen minutes, pages
 * are regenerated in the background, a CDN may sit in front of them, and a
 * reader may leave the tab open overnight. At every one of those layers, a
 * value can be served long after it arrived. If its age were stamped with our
 * own clock at render time, a two-hour-old cached number would describe itself
 * as current — which is precisely the failure §14.1 says would "destroy more
 * credibility than this whole site builds". A timestamp that travels inside
 * the data cannot be falsified by any cache that serves it.
 *
 * The age itself is then computed in the reader's browser, against the
 * reader's clock, at the moment they look (see components/live-age.tsx). The
 * server only ever renders the absolute time, which stays true forever — the
 * same move §6a makes for the register's review dates.
 * ---------------------------------------------------------------------------
 */

/**
 * How often pages and feeds in this layer are regenerated, in seconds.
 *
 * Exported for display and documentation only. Route segment configs must
 * write the literal `900`: Next 16 requires `revalidate` to be statically
 * analysable, and a value imported from here would be silently ignored.
 */
export const LIVE_REVALIDATE_SECONDS = 900;

/** Distance within which a hazard is flagged as near a trade node. A display rule, stated on the page. */
export const PROXIMITY_KM = 300;

export type LiveSourceId = 'ais' | 'gdelt' | 'usgs' | 'gdacs' | 'nhc' | 'eonet' | 'weather';

export const LIVE_SOURCE_IDS: LiveSourceId[] = ['ais', 'gdelt', 'usgs', 'gdacs', 'nhc', 'eonet', 'weather'];

/** What is known about a source before any data is fetched. */
export interface SourceMeta {
  id: LiveSourceId;
  /** The product name, as the publisher uses it. */
  name: string;
  publisher: string;
  /** What the page reads from it, in a phrase: "Earthquakes, magnitude 4.5 and above". */
  measures: string;
  /** A followable page for the source. §6a: a source you cannot follow is not a source. */
  homepage: string;
  /** Update cadence in plain words, as the publisher states it. */
  cadence: string;
  /**
   * Terms, as far as they were verified. Where they were NOT verified this
   * says so rather than guessing — the data is republished, so the terms
   * matter, and an invented licence line is worse than an honest "check".
   */
  terms: string;
  /** Minutes after `asOf` at which a reading is shown as delayed, then stale. */
  delayedAfterMinutes: number;
  staleAfterMinutes: number;
  /** Server-side environment variable required, or null for keyless sources. */
  requiresEnv: string | null;
}

/**
 * The outcome of asking one source for data. Exactly three shapes, and the
 * page must render all three — there is no fourth shape that means "show a
 * placeholder number".
 */
export type Reading<T> =
  | {
      status: 'ok';
      source: LiveSourceId;
      /** ISO 8601. Taken from inside the payload — see the rule at the top. */
      asOf: string;
      /** What `asOf` actually is, in words: "feed generated", "latest vessel message". */
      asOfBasis: string;
      data: T;
      /** Partial failures and caveats, in plain words. Shown on the page. */
      notes: string[];
    }
  | {
      status: 'unavailable';
      source: LiveSourceId;
      /** Safe to display: constructed by us, never an upstream error body or a secret. */
      reason: string;
    }
  | {
      status: 'not-configured';
      source: LiveSourceId;
      /** The environment variable that would enable it. */
      envVar: string;
    };

// ---------------------------------------------------------------------------
// Trade nodes — the reference geometry hazards are measured against
// ---------------------------------------------------------------------------

export type TradeNodeKind = 'chokepoint' | 'port' | 'industrial';

/** [[south, west], [north, east]] in decimal degrees — AISStream's corner order is [lat, lon]. */
export type BoundingBox = [[number, number], [number, number]];

export interface TradeNode {
  id: string;
  name: string;
  kind: TradeNodeKind;
  /** Approximate centre, used for distances. */
  lat: number;
  lon: number;
  /** Chokepoints only: the box vessel positions are sampled within. */
  box?: BoundingBox;
  /** Plain-words caveat shown beside the node, e.g. on receiver coverage. */
  note?: string;
}

/** The nearest trade node to a point, for "180 km from Port of Busan". A distance, never an impact claim. */
export interface NearestNode {
  nodeId: string;
  nodeName: string;
  km: number;
}

// ---------------------------------------------------------------------------
// Per-source data shapes
// ---------------------------------------------------------------------------

export interface ChokepointSample {
  nodeId: string;
  /** Distinct vessels (MMSI) heard in the box during the sample window. */
  vesselsObserved: number;
  /** Of those, how many reported speed over ground of at least 1 knot. */
  vesselsUnderway: number;
  /** Raw message count, for judging whether a zero means anything. */
  messages: number;
}

export interface AisData {
  windowSeconds: number;
  sampledAt: string;
  chokepoints: ChokepointSample[];
}

export interface SignalPoint {
  /** ISO 8601, start of the interval. */
  at: string;
  /** Distinct articles matching the theme in the interval. */
  articles: number;
  /** All articles GDELT monitored in the interval, for scale. */
  monitored: number;
}

export interface SignalSeries {
  themeId: string;
  label: string;
  points: SignalPoint[];
}

export interface Headline {
  title: string;
  url: string;
  domain: string;
  seenAt: string;
  sourceCountry: string | null;
}

export interface GdeltData {
  windowHours: number;
  series: SignalSeries[];
  headlines: Headline[];
}

export interface Quake {
  id: string;
  magnitude: number;
  place: string;
  at: string;
  url: string;
  lat: number;
  lon: number;
  depthKm: number | null;
  tsunamiFlag: boolean;
  /** USGS PAGER alert level, if issued: green | yellow | orange | red. */
  pagerAlert: string | null;
  nearest: NearestNode | null;
}

export interface UsgsData {
  minMagnitude: number;
  windowHours: number;
  quakes: Quake[];
}

export interface HazardAlert {
  id: string;
  type: string;
  typeLabel: string;
  name: string;
  level: string;
  country: string | null;
  from: string | null;
  to: string | null;
  updated: string | null;
  url: string | null;
  lat: number | null;
  lon: number | null;
  nearest: NearestNode | null;
}

export interface GdacsData {
  levels: string[];
  alerts: HazardAlert[];
}

export interface Storm {
  id: string;
  name: string;
  classification: string;
  classificationLabel: string;
  intensityKt: number | null;
  pressureMb: number | null;
  lat: number;
  lon: number;
  movement: string | null;
  updated: string;
  advisoryUrl: string | null;
  nearest: NearestNode | null;
}

export interface NhcData {
  storms: Storm[];
}

export interface NaturalEvent {
  id: string;
  title: string;
  category: string;
  at: string;
  lat: number;
  lon: number;
  url: string | null;
  nearest: NearestNode | null;
}

export interface EonetData {
  totalOpen: number;
  /** Only events within PROXIMITY_KM of a trade node — the rest is noise for this page. */
  nearTradeNodes: NaturalEvent[];
}

export interface PortWind {
  nodeId: string;
  windMs: number;
  gustMs: number | null;
  beaufort: number;
  beaufortLabel: string;
  at: string;
}

export interface WeatherData {
  ports: PortWind[];
}

export interface LiveSnapshot {
  /** When this page's data was assembled. The page is regenerated every fifteen minutes. */
  generatedAt: string;
  ais: Reading<AisData>;
  gdelt: Reading<GdeltData>;
  usgs: Reading<UsgsData>;
  gdacs: Reading<GdacsData>;
  nhc: Reading<NhcData>;
  eonet: Reading<EonetData>;
  weather: Reading<WeatherData>;
}

// ---------------------------------------------------------------------------
// Labels — pure, safe for client components
// ---------------------------------------------------------------------------

export type Freshness = 'live' | 'delayed' | 'stale';

export const FRESHNESS_LABELS: Record<Freshness, string> = {
  live: 'Live',
  delayed: 'Delayed',
  stale: 'Stale',
};

/** Freshness from an age in minutes. Pure, so the client and a test can agree. */
export function freshnessFor(
  ageMinutes: number,
  meta: Pick<SourceMeta, 'delayedAfterMinutes' | 'staleAfterMinutes'>,
): Freshness {
  if (ageMinutes >= meta.staleAfterMinutes) return 'stale';
  if (ageMinutes >= meta.delayedAfterMinutes) return 'delayed';
  return 'live';
}

/**
 * The WMO Beaufort scale, on mean wind speed at 10 m in m/s. A published
 * standard rather than a threshold of ours, which is why the page can use it
 * to rank ports without making a claim about any terminal's operations.
 */
export const BEAUFORT: Array<{ force: number; minMs: number; label: string }> = [
  { force: 0, minMs: 0, label: 'Calm' },
  { force: 1, minMs: 0.5, label: 'Light air' },
  { force: 2, minMs: 1.6, label: 'Light breeze' },
  { force: 3, minMs: 3.4, label: 'Gentle breeze' },
  { force: 4, minMs: 5.5, label: 'Moderate breeze' },
  { force: 5, minMs: 8.0, label: 'Fresh breeze' },
  { force: 6, minMs: 10.8, label: 'Strong breeze' },
  { force: 7, minMs: 13.9, label: 'Near gale' },
  { force: 8, minMs: 17.2, label: 'Gale' },
  { force: 9, minMs: 20.8, label: 'Strong gale' },
  { force: 10, minMs: 24.5, label: 'Storm' },
  { force: 11, minMs: 28.5, label: 'Violent storm' },
  { force: 12, minMs: 32.7, label: 'Hurricane force' },
];

export function beaufortFor(windMs: number): { force: number; label: string } {
  let match = BEAUFORT[0];
  for (const step of BEAUFORT) {
    if (windMs >= step.minMs) match = step;
  }
  return { force: match.force, label: match.label };
}
