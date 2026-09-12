/**
 * The public content API. Pages and components import from here and nowhere
 * else in this folder.
 *
 * If you find yourself importing `./sources/local-files` from a page, stop:
 * the whole point of this layer is that pages do not know where issues come
 * from. An ESLint rule in eslint.config.mjs enforces it.
 */

import type { Issue, IssueNeighbours, IssueSummary } from './types';
import { getContentSource } from './sources';

export type { ContentDiagnostics, Issue, IssueNeighbours, IssueSummary } from './types';
export { getContentSourceName } from './sources';

/** Newest first. `limit` caps the result. */
export async function listIssues(limit?: number): Promise<IssueSummary[]> {
  return getContentSource().listIssues(limit);
}

/** Null for an unknown slug. Callers turn that into a 404. */
export async function getIssue(slug: string): Promise<Issue | null> {
  return getContentSource().getIssue(slug);
}

/** Every slug, for generateStaticParams and the sitemap. */
export async function listIssueSlugs(): Promise<string[]> {
  const issues = await listIssues();
  return issues.map((issue) => issue.slug);
}

/**
 * Previous/next in archive order. "Previous" means published earlier, which is
 * the later position in a newest-first list.
 */
export async function getIssueNeighbours(slug: string): Promise<IssueNeighbours> {
  const issues = await listIssues();
  const index = issues.findIndex((issue) => issue.slug === slug);
  if (index === -1) return { previous: null, next: null };

  return {
    previous: issues[index + 1] ?? null,
    next: issues[index - 1] ?? null,
  };
}

/** Issues grouped by publication year, newest year first. */
export async function listIssuesByYear(): Promise<Array<{ year: string; issues: IssueSummary[] }>> {
  const issues = await listIssues();
  const groups = new Map<string, IssueSummary[]>();

  for (const issue of issues) {
    const date = new Date(issue.publishedAt);
    // Issues with no usable date are grouped separately rather than being
    // silently filed under the current year.
    const year = Number.isNaN(date.getTime()) ? 'Undated' : String(date.getUTCFullYear());
    const bucket = groups.get(year);
    if (bucket) bucket.push(issue);
    else groups.set(year, [issue]);
  }

  return [...groups.entries()]
    .sort((a, b) => {
      if (a[0] === 'Undated') return 1;
      if (b[0] === 'Undated') return -1;
      return Number(b[0]) - Number(a[0]);
    })
    .map(([year, grouped]) => ({ year, issues: grouped }));
}

/** Used by the archive page to decide whether to group by year. */
export const GROUP_ARCHIVE_ABOVE = 12;
