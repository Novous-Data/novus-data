/**
 * The contract between the site and wherever issues happen to come from.
 *
 * Pages import from `@/lib/content` only. They never import a source
 * implementation, never mention RSS, and never need to know that Beehiiv
 * exists. That boundary is what lets the publication move off Beehiiv later
 * without touching a single page.
 */

export interface IssueSummary {
  /** Stable, URL-safe, and permanent once published. Never renamed. */
  slug: string;
  /** Null when the issue carries no number. Never derived from position. */
  issueNumber: number | null;
  title: string;
  /**
   * ISO 8601 timestamp as written in the file. Kept as a raw string rather
   * than a Date so an unparseable value survives to the formatter, which
   * returns null and causes the UI to omit the date. Today's date is never
   * substituted for a missing one.
   */
  publishedAt: string;
  /** Plain text, no HTML. Null when the issue supplied none. */
  excerpt: string | null;
  /** Canonical URL on the original publishing platform, when one exists. */
  externalUrl: string | null;
  coverImageUrl: string | null;
  tags: string[];
}

export interface Issue extends IssueSummary {
  /** Sanitised at write time. Null when no body was captured. */
  contentHtml: string | null;
}

export interface ContentSource {
  /** Newest first. `limit` caps the result; omit it for everything. */
  listIssues(limit?: number): Promise<IssueSummary[]>;
  /** Null for an unknown slug — the route turns that into a 404. */
  getIssue(slug: string): Promise<Issue | null>;
}

/** Where an issue sits in the archive, for previous/next navigation. */
export interface IssueNeighbours {
  /** The issue published immediately before this one. */
  previous: IssueSummary | null;
  /** The issue published immediately after this one. */
  next: IssueSummary | null;
}

/** Reported by /debug/content so a bad file is visible immediately. */
export interface ContentDiagnostics {
  sourceName: string;
  directory: string;
  fileCount: number;
  issues: Array<{
    file: string;
    slug: string;
    title: string;
    publishedAt: string;
    dateParsed: boolean;
    issueNumber: number | null;
    bodyLength: number;
    words: number;
    hasExcerpt: boolean;
  }>;
  warnings: string[];
}
