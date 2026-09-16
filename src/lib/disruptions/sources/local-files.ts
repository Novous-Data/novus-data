/**
 * Reads the disruption register from `content/disruptions/*.md`.
 *
 * Same shape as the issue content source, and the same guarantee: one bad file
 * warns and is skipped rather than taking down the build.
 *
 * What is different here is how much it throws away. A disruption without a
 * source is not published. An exposure without a mechanism, a confidence, an
 * as-of date and a source is not published. The chart can only draw what
 * survives this file, which is the whole point — see the note at the top of
 * ../types.ts.
 */

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import matter from 'gray-matter';

import type {
  Confidence,
  Disruption,
  DisruptionCategory,
  DisruptionDiagnostics,
  DisruptionStatus,
  Entity,
  Exposure,
  Severity,
  Source,
} from '../types';
import {
  CONFIDENCES,
  DISRUPTION_CATEGORIES,
  DISRUPTION_STATUSES,
  SEVERITIES,
} from '../types';

/**
 * Normally content/disruptions/ in this repository.
 *
 * NOVUS_DISRUPTIONS_DIR is its own variable rather than something derived from
 * NOVUS_CONTENT_DIR. An earlier version resolved this as a sibling of the
 * issues directory, which meant pointing the issues override anywhere moved the
 * register too — a surprise waiting to happen. Review tooling sets both
 * explicitly; neither should ever be set on Vercel.
 */
export const DISRUPTIONS_DIRECTORY = process.env.NOVUS_DISRUPTIONS_DIR
  ? path.resolve(process.env.NOVUS_DISRUPTIONS_DIR)
  : path.join(process.cwd(), 'content', 'disruptions');

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface ParsedFile {
  file: string;
  disruption: Disruption;
}

interface ReadResult {
  disruptions: Disruption[];
  warnings: string[];
  files: string[];
  parsed: ParsedFile[];
}

function warn(warnings: string[], message: string): void {
  warnings.push(message);
  console.warn(`[disruptions] ${message}`);
}

function text(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** YAML gives a Date for unquoted dates and a string for quoted ones. */
function isoDate(raw: unknown): string | null {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw.toISOString();
  const value = text(raw);
  if (!value) return null;
  return Number.isNaN(new Date(value).getTime()) ? null : value;
}

function oneOf<T extends string>(raw: unknown, allowed: T[]): T | null {
  const value = text(raw);
  return value && (allowed as string[]).includes(value) ? (value as T) : null;
}

/**
 * A source is only a source if it can be followed. A citation with no URL is a
 * claim with extra words.
 */
function parseSources(raw: unknown, label: string, warnings: string[]): Source[] {
  if (!Array.isArray(raw)) return [];
  const sources: Source[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const record = entry as Record<string, unknown>;

    const title = text(record.title);
    const url = text(record.url);
    const publisher = text(record.publisher);
    const retrievedAt = isoDate(record.retrievedAt);

    if (!title || !url || !publisher) {
      warn(warnings, `${label}: dropped a source missing title, url or publisher.`);
      continue;
    }
    if (!/^https?:\/\//i.test(url)) {
      warn(warnings, `${label}: dropped source "${title}" — url must be http(s).`);
      continue;
    }

    sources.push({ title, url, publisher, retrievedAt: retrievedAt ?? '' });
  }

  return sources;
}

function parseEntity(raw: unknown, label: string, warnings: string[]): Entity | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;

  const id = text(record.id);
  const name = text(record.name);
  const sector = text(record.sector);
  const kind = oneOf(record.kind, ['company', 'sector'] as const);

  if (!id || !name || !sector || !kind) {
    warn(warnings, `${label}: dropped an exposure — entity needs id, name, kind and sector.`);
    return null;
  }
  if (!ID_PATTERN.test(id)) {
    warn(warnings, `${label}: dropped an exposure — entity id "${id}" is not URL-safe.`);
    return null;
  }

  return { id, name, kind, ticker: text(record.ticker), sector };
}

/**
 * The gate. An exposure that clears this becomes a coloured cell; anything else
 * is dropped with a warning that names the file and says which piece is absent.
 */
function parseExposures(raw: unknown, label: string, warnings: string[]): Exposure[] {
  if (!Array.isArray(raw)) return [];

  const exposures: Exposure[] = [];
  const seen = new Set<string>();

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const record = entry as Record<string, unknown>;

    const entity = parseEntity(record.entity, label, warnings);
    if (!entity) continue;

    const where = `${label} → ${entity.name}`;

    const severity = oneOf<Severity>(record.severity, SEVERITIES);
    if (!severity) {
      warn(warnings, `${where}: dropped — severity must be one of ${SEVERITIES.join(', ')}.`);
      continue;
    }

    const confidence = oneOf<Confidence>(record.confidence, CONFIDENCES);
    if (!confidence) {
      warn(warnings, `${where}: dropped — confidence must be one of ${CONFIDENCES.join(', ')}.`);
      continue;
    }

    const mechanism = text(record.mechanism);
    if (!mechanism) {
      warn(
        warnings,
        `${where}: dropped — no mechanism. State how the disruption reaches this entity, or do not claim it does.`,
      );
      continue;
    }

    const asOf = isoDate(record.asOf);
    if (!asOf) {
      warn(warnings, `${where}: dropped — asOf must be a valid date. An undated assessment is not publishable.`);
      continue;
    }

    const sources = parseSources(record.sources, where, warnings);
    if (sources.length === 0) {
      warn(warnings, `${where}: dropped — an exposure needs at least one followable source.`);
      continue;
    }

    if (seen.has(entity.id)) {
      warn(warnings, `${where}: dropped — this entity already has an exposure on this disruption.`);
      continue;
    }

    seen.add(entity.id);
    exposures.push({ entity, severity, confidence, mechanism, asOf, sources });
  }

  return exposures;
}

function parseDisruptionFile(file: string, raw: string, warnings: string[]): Disruption | null {
  let data: Record<string, unknown>;
  let body: string;

  try {
    const parsed = matter(raw);
    data = parsed.data as Record<string, unknown>;
    body = parsed.content;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    warn(warnings, `Skipped ${file}: frontmatter could not be parsed (${reason}).`);
    return null;
  }

  const id = text(data.id);
  if (!id || !ID_PATTERN.test(id)) {
    warn(warnings, `Skipped ${file}: needs a URL-safe "id" (lowercase, digits, single hyphens).`);
    return null;
  }

  const title = text(data.title);
  if (!title) {
    warn(warnings, `Skipped ${file}: needs a non-empty "title".`);
    return null;
  }

  const status = oneOf<DisruptionStatus>(data.status, DISRUPTION_STATUSES);
  if (!status) {
    warn(warnings, `Skipped ${file}: "status" must be one of ${DISRUPTION_STATUSES.join(', ')}.`);
    return null;
  }

  const category = oneOf<DisruptionCategory>(data.category, DISRUPTION_CATEGORIES);
  if (!category) {
    warn(warnings, `Skipped ${file}: "category" must be one of ${DISRUPTION_CATEGORIES.join(', ')}.`);
    return null;
  }

  const updatedAt = isoDate(data.updatedAt);
  if (!updatedAt) {
    warn(
      warnings,
      `Skipped ${file}: "updatedAt" must be a valid date. A tracked disruption with no review date cannot be shown as current.`,
    );
    return null;
  }

  const summary = text(data.summary);
  if (!summary) {
    warn(warnings, `Skipped ${file}: needs a "summary".`);
    return null;
  }

  const sources = parseSources(data.sources, file, warnings);
  if (sources.length === 0) {
    warn(warnings, `Skipped ${file}: a disruption needs at least one followable source.`);
    return null;
  }

  // Falls back to the first three letters of the id so a missing label never
  // blanks a chart column.
  const shortLabel = (text(data.shortLabel) ?? id.replace(/-/g, '').slice(0, 3)).toUpperCase();

  const contentHtml = body.trim();

  return {
    id,
    title,
    shortLabel,
    status,
    category,
    startedAt: isoDate(data.startedAt) ?? '',
    updatedAt,
    summary,
    sources,
    exposures: parseExposures(data.exposures, file, warnings),
    contentHtml: contentHtml.length > 0 ? contentHtml : null,
  };
}

/** Active first, then by most recently reviewed. */
const STATUS_ORDER: Record<DisruptionStatus, number> = {
  active: 0,
  easing: 1,
  watch: 2,
  resolved: 3,
};

function compare(a: ParsedFile, b: ParsedFile): number {
  const byStatus = STATUS_ORDER[a.disruption.status] - STATUS_ORDER[b.disruption.status];
  if (byStatus !== 0) return byStatus;
  return (
    new Date(b.disruption.updatedAt).getTime() - new Date(a.disruption.updatedAt).getTime()
  );
}

async function readAll(): Promise<ReadResult> {
  const warnings: string[] = [];

  let entries: string[];
  try {
    entries = await readdir(DISRUPTIONS_DIRECTORY);
  } catch {
    // No directory yet is an empty register, not an error.
    return { disruptions: [], warnings, files: [], parsed: [] };
  }

  const files = entries.filter((name) => name.endsWith('.md')).sort();
  const parsed: ParsedFile[] = [];
  const seenIds = new Map<string, string>();

  for (const file of files) {
    const raw = await readFile(path.join(DISRUPTIONS_DIRECTORY, file), 'utf8');
    const disruption = parseDisruptionFile(file, raw, warnings);
    if (!disruption) continue;

    const existing = seenIds.get(disruption.id);
    if (existing) {
      warn(warnings, `Skipped ${file}: id "${disruption.id}" is already used by ${existing}.`);
      continue;
    }

    seenIds.set(disruption.id, file);
    parsed.push({ file, disruption });
  }

  parsed.sort(compare);

  return { disruptions: parsed.map((entry) => entry.disruption), warnings, files, parsed };
}

let cached: Promise<ReadResult> | null = null;

function load(): Promise<ReadResult> {
  if (process.env.NODE_ENV !== 'production') return readAll();
  cached ??= readAll();
  return cached;
}

export async function readDisruptions(): Promise<Disruption[]> {
  return (await load()).disruptions;
}

export async function readDisruptionDiagnostics(): Promise<DisruptionDiagnostics> {
  const { parsed, warnings, files } = await readAll();

  return {
    directory: path.relative(process.cwd(), DISRUPTIONS_DIRECTORY),
    fileCount: files.length,
    warnings,
    entries: parsed.map(({ file, disruption }) => ({
      file,
      id: disruption.id,
      title: disruption.title,
      status: disruption.status,
      updatedAt: disruption.updatedAt,
      dateParsed: !Number.isNaN(new Date(disruption.updatedAt).getTime()),
      sourceCount: disruption.sources.length,
      exposureCount: disruption.exposures.length,
      bodyLength: disruption.contentHtml?.length ?? 0,
    })),
  };
}
