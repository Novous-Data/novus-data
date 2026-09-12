/**
 * The disruption register and the exposure model behind the exposure chart.
 *
 * This is the second typed content layer, built to the pattern CLAUDE.md §14.1
 * lays out: its own types, its own sources, its own public API. It is
 * deliberately NOT merged into the issue content layer — an issue is a document
 * and a disruption is a tracked state with an as-of date, and they fail in
 * different ways.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS FILE IS SO STRICT
 *
 * The exposure chart tells a reader that a named problem reaches a named
 * company. On a site about markets, someone may act on that. So the rule is:
 * a claim that cannot be checked does not render.
 *
 * Every exposure must carry four things or it is dropped at load time, with a
 * warning naming the file:
 *
 *   1. a mechanism  — the sentence explaining HOW the problem reaches the
 *                     company. "Affected" is not a finding; "routes roughly a
 *                     fifth of its Asia–Europe volume through the canal" is.
 *   2. a confidence — whether this is reported, inferred, or estimated.
 *   3. an asOf date — when the assessment was last true.
 *   4. at least one source — with a URL and a publisher.
 *
 * There is no way to produce a coloured cell without all four. That constraint
 * is the product, not an obstacle to it.
 * ---------------------------------------------------------------------------
 */

/** A citation. Every claim on this site traces back to at least one. */
export interface Source {
  title: string;
  url: string;
  /** Who published it — "Panama Canal Authority", not "the internet". */
  publisher: string;
  /** ISO date the source was read. Sources move; this records when it said this. */
  retrievedAt: string;
}

/** Where a disruption is in its life. Drives the register and the chart. */
export type DisruptionStatus =
  /** Not yet disrupting, but the conditions are in place. */
  | 'watch'
  /** Currently constraining trade. */
  | 'active'
  /** Still present, measurably improving. */
  | 'easing'
  /** Over. Kept in the register because the record matters. */
  | 'resolved';

export const DISRUPTION_STATUSES: DisruptionStatus[] = ['watch', 'active', 'easing', 'resolved'];

/** What kind of problem it is. Matches the beat described on /coverage. */
export type DisruptionCategory =
  | 'chokepoint'
  | 'port'
  | 'policy'
  | 'input'
  | 'energy'
  | 'labour'
  | 'weather';

export const DISRUPTION_CATEGORIES: DisruptionCategory[] = [
  'chokepoint',
  'port',
  'policy',
  'input',
  'energy',
  'labour',
  'weather',
];

export const CATEGORY_LABELS: Record<DisruptionCategory, string> = {
  chokepoint: 'Chokepoint',
  port: 'Port and terminal',
  policy: 'Trade policy',
  input: 'Industrial input',
  energy: 'Energy and fuel',
  labour: 'Labour',
  weather: 'Weather and climate',
};

export const STATUS_LABELS: Record<DisruptionStatus, string> = {
  watch: 'Watch',
  active: 'Active',
  easing: 'Easing',
  resolved: 'Resolved',
};

/**
 * How hard a disruption reaches a given company or sector.
 *
 * Three ordered levels, no more. A finer scale would imply a precision that
 * reading public sources cannot support, and the chart would be claiming more
 * than it knows.
 */
export type Severity = 'low' | 'moderate' | 'high';

/** Ordered low → high. The chart's ordinal ramp follows this order. */
export const SEVERITIES: Severity[] = ['low', 'moderate', 'high'];

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
};

export const SEVERITY_RANK: Record<Severity, number> = { low: 1, moderate: 2, high: 3 };

/**
 * How the exposure was established. This is the difference between reporting
 * and guessing, and the chart shows it rather than burying it.
 */
export type Confidence =
  /** The company or a regulator said so, or a named report documents it. */
  | 'reported'
  /** Follows from disclosed facts — a filing, a route map, a customer list. */
  | 'inferred'
  /** A judgement from partial information. The weakest claim the site will print. */
  | 'estimated';

export const CONFIDENCES: Confidence[] = ['reported', 'inferred', 'estimated'];

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  reported: 'Reported',
  inferred: 'Inferred',
  estimated: 'Estimated',
};

export const CONFIDENCE_NOTES: Record<Confidence, string> = {
  reported: 'Stated by the company, a regulator, or a named report.',
  inferred: 'Follows from disclosed facts such as filings or published routings.',
  estimated: 'A judgement from partial information. Treat as the weakest claim here.',
};

/** A company or a sector. Sectors are honest where company detail is not known. */
export type EntityKind = 'company' | 'sector';

export interface Entity {
  /** Stable, URL-safe, permanent. Used as an anchor and as a chart key. */
  id: string;
  name: string;
  kind: EntityKind;
  /** Listing ticker, when there is one. Never invented. */
  ticker: string | null;
  /** Plain-language sector. Used to group the chart. */
  sector: string;
}

export interface Exposure {
  entity: Entity;
  severity: Severity;
  confidence: Confidence;
  /** HOW the disruption reaches this entity. Required; no cell without it. */
  mechanism: string;
  /** ISO date this assessment was last true. Required. */
  asOf: string;
  /** At least one. Required. */
  sources: Source[];
}

export interface DisruptionSummary {
  id: string;
  title: string;
  /** Two or three characters for the chart's column headers, e.g. "PAN". */
  shortLabel: string;
  status: DisruptionStatus;
  category: DisruptionCategory;
  /** ISO date the disruption began. */
  startedAt: string;
  /** ISO date the entry was last reviewed. Drives the staleness warning. */
  updatedAt: string;
  /** One or two sentences. Plain, no figures that are not in the sources. */
  summary: string;
  sources: Source[];
  exposures: Exposure[];
}

export interface Disruption extends DisruptionSummary {
  /** Sanitised analysis body. Null when the entry is a register line only. */
  contentHtml: string | null;
}

/** One row of the exposure chart: an entity and everything reaching it. */
export interface EntityExposure {
  entity: Entity;
  /** Keyed by disruption id. Absent means no exposure has been established. */
  byDisruption: Map<string, Exposure>;
  /** The worst severity recorded against this entity. Drives row ordering. */
  worstSeverity: Severity;
  /** How many disruptions reach it. */
  count: number;
}

/** Reported by /debug/content so a bad register file is visible immediately. */
export interface DisruptionDiagnostics {
  directory: string;
  fileCount: number;
  entries: Array<{
    file: string;
    id: string;
    title: string;
    status: DisruptionStatus;
    updatedAt: string;
    dateParsed: boolean;
    sourceCount: number;
    exposureCount: number;
    bodyLength: number;
  }>;
  warnings: string[];
}
