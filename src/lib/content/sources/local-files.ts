/**
 * THE RUNTIME CONTENT SOURCE.
 *
 * Reads `content/issues/*.md` from the repository. This repository is the
 * archive of record: once `scripts/sync-issues.ts` has written an issue here
 * it is owned by this repo permanently, and the site never contacts Beehiiv
 * at build time or at request time.
 *
 * Files are hand-editable on purpose. Fixing a typo in a published issue is a
 * normal edit-and-commit, not a re-sync.
 */

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import matter from 'gray-matter';

import type { ContentDiagnostics, ContentSource, Issue } from '../types';
import { wordCount } from '@/lib/format';

/**
 * Normally content/issues/ in this repository.
 *
 * NOVUS_CONTENT_DIR exists so the review preview can build a second copy of
 * the site against a throwaway archive of [SAMPLE] issues without ever writing
 * them into the repository. It is not used by `npm run dev`, `npm run build`
 * or any deployment, and it should not be set on Vercel.
 */
export const ISSUES_DIRECTORY = process.env.NOVUS_CONTENT_DIR
  ? path.resolve(process.env.NOVUS_CONTENT_DIR)
  : path.join(process.cwd(), 'content', 'issues');

/** Slugs are URLs. Keep them boring so they never need escaping. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface ParsedFile {
  file: string;
  issue: Issue;
}

interface ReadResult {
  issues: Issue[];
  warnings: string[];
  files: string[];
  parsed: ParsedFile[];
}

function warn(warnings: string[], message: string): void {
  warnings.push(message);
  // Surfaced in the build log so a bad file cannot ship unnoticed.
  console.warn(`[content] ${message}`);
}

/** Coerce frontmatter `tags` into a clean string array whatever YAML produced. */
function normaliseTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

function normaliseText(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normaliseIssueNumber(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.trunc(raw);
  if (typeof raw === 'string' && raw.trim() !== '') {
    const parsed = Number(raw.trim());
    if (Number.isFinite(parsed)) return Math.trunc(parsed);
  }
  return null;
}

/**
 * YAML dates are parsed into JS Date objects by js-yaml when unquoted, and
 * left as strings when quoted. Accept both and always store ISO 8601.
 */
function normalisePublishedAt(raw: unknown): string {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw.toISOString();
  if (typeof raw === 'string') return raw.trim();
  return '';
}

/**
 * Parse one file. Returns null — with a warning — rather than throwing, so a
 * single malformed file cannot take down the whole build.
 */
function parseIssueFile(file: string, raw: string, warnings: string[]): Issue | null {
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

  const title = normaliseText(data.title);
  if (!title) {
    warn(warnings, `Skipped ${file}: frontmatter is missing a non-empty "title".`);
    return null;
  }

  const slug = normaliseText(data.slug);
  if (!slug) {
    warn(warnings, `Skipped ${file}: frontmatter is missing a non-empty "slug".`);
    return null;
  }

  if (!SLUG_PATTERN.test(slug)) {
    warn(
      warnings,
      `Skipped ${file}: slug "${slug}" is not URL-safe. Use lowercase letters, digits and single hyphens.`,
    );
    return null;
  }

  const publishedAt = normalisePublishedAt(data.publishedAt);
  if (publishedAt === '') {
    warn(warnings, `${file}: no "publishedAt" — the date will be omitted rather than guessed.`);
  } else if (Number.isNaN(new Date(publishedAt).getTime())) {
    warn(
      warnings,
      `${file}: "publishedAt" (${publishedAt}) is not a valid date — the date will be omitted rather than guessed.`,
    );
  }

  const contentHtml = body.trim();

  return {
    slug,
    issueNumber: normaliseIssueNumber(data.issueNumber),
    title,
    publishedAt,
    excerpt: normaliseText(data.excerpt),
    // `beehiivUrl` is the frontmatter key the sync script writes; the site
    // deliberately exposes it under the platform-neutral name externalUrl.
    externalUrl: normaliseText(data.beehiivUrl) ?? normaliseText(data.externalUrl),
    coverImageUrl: normaliseText(data.coverImageUrl),
    tags: normaliseTags(data.tags),
    contentHtml: contentHtml.length > 0 ? contentHtml : null,
  };
}

/**
 * Newest first. Unparseable or missing dates sort last, keeping their filename
 * order, so a bad date degrades ordering instead of scrambling the archive.
 */
function compareIssues(a: ParsedFile, b: ParsedFile): number {
  const timeA = new Date(a.issue.publishedAt).getTime();
  const timeB = new Date(b.issue.publishedAt).getTime();
  const validA = !Number.isNaN(timeA);
  const validB = !Number.isNaN(timeB);

  if (validA && validB && timeA !== timeB) return timeB - timeA;
  if (validA !== validB) return validA ? -1 : 1;

  // Filename prefix is a zero-padded sort key, so a plain descending string
  // comparison is the right tie-break.
  return b.file.localeCompare(a.file);
}

async function readAll(): Promise<ReadResult> {
  const warnings: string[] = [];

  let entries: string[];
  try {
    entries = await readdir(ISSUES_DIRECTORY);
  } catch {
    // No directory yet is the pre-launch state, not an error.
    return { issues: [], warnings, files: [], parsed: [] };
  }

  const files = entries.filter((name) => name.endsWith('.md')).sort();
  const parsed: ParsedFile[] = [];
  const seenSlugs = new Map<string, string>();

  for (const file of files) {
    const raw = await readFile(path.join(ISSUES_DIRECTORY, file), 'utf8');
    const issue = parseIssueFile(file, raw, warnings);
    if (!issue) continue;

    const existing = seenSlugs.get(issue.slug);
    if (existing) {
      warn(
        warnings,
        `Skipped ${file}: slug "${issue.slug}" is already used by ${existing}. Slugs are permanent URLs and must be unique.`,
      );
      continue;
    }

    seenSlugs.set(issue.slug, file);
    parsed.push({ file, issue });
  }

  parsed.sort(compareIssues);

  return { issues: parsed.map((entry) => entry.issue), warnings, files, parsed };
}

/**
 * Content does not change during a production build, so read the directory
 * once and reuse it across every page. In development the cache is skipped so
 * that editing a file shows up on refresh.
 */
let cached: Promise<ReadResult> | null = null;

function load(): Promise<ReadResult> {
  if (process.env.NODE_ENV !== 'production') return readAll();
  cached ??= readAll();
  return cached;
}

function toSummary(issue: Issue) {
  // Drop the body so list pages never carry full article HTML in their payload.
  const { contentHtml: _contentHtml, ...summary } = issue;
  return summary;
}

export const localFilesSource: ContentSource = {
  async listIssues(limit) {
    const { issues } = await load();
    const summaries = issues.map(toSummary);
    return typeof limit === 'number' ? summaries.slice(0, limit) : summaries;
  },

  async getIssue(slug) {
    const { issues } = await load();
    return issues.find((issue) => issue.slug === slug) ?? null;
  },
};

/** Backs /debug/content. Development only; see that route. */
export async function readDiagnostics(): Promise<ContentDiagnostics> {
  const { parsed, warnings, files } = await readAll();

  return {
    sourceName: 'local-files',
    directory: path.relative(process.cwd(), ISSUES_DIRECTORY),
    fileCount: files.length,
    warnings,
    issues: parsed.map(({ file, issue }) => ({
      file,
      slug: issue.slug,
      title: issue.title,
      publishedAt: issue.publishedAt,
      dateParsed:
        issue.publishedAt !== '' && !Number.isNaN(new Date(issue.publishedAt).getTime()),
      issueNumber: issue.issueNumber,
      bodyLength: issue.contentHtml?.length ?? 0,
      words: wordCount(issue.contentHtml),
      hasExcerpt: issue.excerpt !== null,
    })),
  };
}
