/**
 * Development-only content source.
 *
 * Active only when CONTENT_SOURCE=fixtures. Every title is prefixed [SAMPLE]
 * so that a fixture reaching a screenshot, a share preview or a deployment is
 * unmistakable, and the module refuses to load in a production build at all.
 *
 * Rule 1 forbids fabricated content anywhere it could reach production. This
 * file is the single, deliberately fenced exception.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS SET IS FOR, AND WHY IT IS THIS SIZE
 *
 * Three issues was enough to check that a page rendered. It was not enough to
 * work on the site, because most of the archive's behaviour only appears above
 * a threshold:
 *
 *   - `/briefings` groups by year once there are more than GROUP_ARCHIVE_ABOVE
 *     (12) issues. Below that the grouped layout is unreachable.
 *   - Previous/next navigation needs a run of issues to exercise both ends.
 *   - Reading time, excerpt wrapping and title wrapping only look real across
 *     a spread of lengths.
 *
 * So this set is sixteen issues across two calendar years, and it deliberately
 * includes the awkward cases rather than sixteen tidy ones:
 *
 *   - a null `issueNumber` (a special issue outside the numbering)
 *   - an unparseable `publishedAt`, so the "date omitted, never substituted"
 *     path is visible rather than theoretical
 *   - a title long enough to wrap twice in a list
 *   - an issue with no excerpt, and one with no body at all
 *   - an `externalUrl` on some and not others
 *
 * If you add to this, keep at least one of each awkward case. They are the
 * reason the set is useful.
 * ---------------------------------------------------------------------------
 */

import type { ContentSource, Issue } from '../types';

if (process.env.NODE_ENV === 'production' && process.env.CONTENT_SOURCE === 'fixtures') {
  throw new Error(
    'CONTENT_SOURCE=fixtures must never be used for a production build. ' +
      'Fixture issues are placeholder text and would publish as if they were real briefings. ' +
      'Set CONTENT_SOURCE=local (or leave it unset).',
  );
}

/** A short body. For checking a list view's reading-time estimate at the low end. */
const SHORT_BODY = `
<p>[SAMPLE] A single short paragraph, used to check the low end of the reading-time estimate and how an issue page looks when there is very little in it.</p>
`.trim();

/** The standard body. Exercises every element the prose styles target. */
const SAMPLE_BODY = `
<p>[SAMPLE] Placeholder body text used to check typography, measure and spacing on the issue template. It is not a briefing and states nothing about the world.</p>
<h2>[SAMPLE] A second-level heading</h2>
<p>[SAMPLE] A second paragraph, long enough to wrap several times so that line height, measure and paragraph spacing can be judged at something close to real reading length rather than on a single short line.</p>
<ul><li>[SAMPLE] A list item</li><li>[SAMPLE] Another list item</li></ul>
<blockquote><p>[SAMPLE] A block quotation, for checking the quotation treatment.</p></blockquote>
`.trim();

/**
 * A long body. This is the one that matters for reviewing the reading
 * experience, because it is the only fixture long enough to scroll.
 */
const LONG_BODY = `
<p>[SAMPLE] An opening paragraph that runs to a realistic length, because the first paragraph of a briefing carries more weight than any other and it is worth seeing it set at the measure the site actually uses rather than at a length that flatters the layout.</p>
<h2>[SAMPLE] The first section</h2>
<p>[SAMPLE] Body copy that wraps across several lines, so that leading, measure and the space between paragraphs can all be judged together. A single short line tells you almost nothing about whether a reading surface works.</p>
<p>[SAMPLE] A second paragraph in the same section, so the spacing <em>between</em> paragraphs is visible as well as the spacing within them, and so an emphasised phrase can be checked against the surrounding weight.</p>
<h3>[SAMPLE] A third-level heading</h3>
<p>[SAMPLE] Heading levels below the second are rare in a briefing but they exist, and an unstyled one is obvious the moment it appears. This paragraph follows one, with an <a href="https://example.invalid/reference">inline link</a> in it so link colour and underline offset can be checked inside running text rather than only in isolation.</p>
<ul>
<li>[SAMPLE] A list item long enough to wrap onto a second line, which is where list indentation either works or does not.</li>
<li>[SAMPLE] A shorter one.</li>
<li>[SAMPLE] A third, for rhythm.</li>
</ul>
<h2>[SAMPLE] The second section</h2>
<p>[SAMPLE] More body copy. The point of a fixture this long is that it is the only way to see what the page feels like after a minute of reading, which is the state a real reader spends nearly all their time in.</p>
<blockquote><p>[SAMPLE] A block quotation, set at the measure it will really occupy, with enough text in it to wrap.</p></blockquote>
<ol>
<li>[SAMPLE] An ordered list item, because numbered lists are styled separately.</li>
<li>[SAMPLE] A second.</li>
</ol>
<p>[SAMPLE] A closing paragraph, so the end of the body can be seen against whatever follows it on the page.</p>
`.trim();

interface FixtureRow {
  slug: string;
  issueNumber: number | null;
  title: string;
  publishedAt: string;
  excerpt: string | null;
  externalUrl?: string | null;
  contentHtml?: string | null;
}

/**
 * Newest first, matching what `listIssues` promises. Dates span two calendar
 * years so `/briefings` renders its grouped layout.
 */
const rows: FixtureRow[] = [
  {
    slug: 'sample-issue-sixteen',
    issueNumber: null,
    title: '[SAMPLE] A special issue, outside the numbering',
    publishedAt: '2026-03-25T08:00:00.000Z',
    excerpt:
      '[SAMPLE] issueNumber is null here. Nothing on the site may derive a number from position, so this issue should render without one rather than being labelled 16.',
    contentHtml: SAMPLE_BODY,
  },
  {
    slug: 'sample-issue-fifteen',
    issueNumber: 15,
    title: '[SAMPLE] Fifteenth placeholder issue',
    publishedAt: '2026-03-18T08:00:00.000Z',
    excerpt: '[SAMPLE] Placeholder excerpt used to check how a summary wraps in list views.',
    contentHtml: LONG_BODY,
  },
  {
    slug: 'sample-issue-fourteen',
    issueNumber: 14,
    title:
      '[SAMPLE] Fourteenth placeholder issue, with a deliberately long title that should wrap onto at least two lines in every list view on the site',
    publishedAt: '2026-03-11T08:00:00.000Z',
    excerpt: '[SAMPLE] Placeholder excerpt.',
    externalUrl: 'https://example.invalid/p/sample-issue-fourteen',
    contentHtml: SAMPLE_BODY,
  },
  {
    slug: 'sample-issue-thirteen',
    issueNumber: 13,
    title: '[SAMPLE] Thirteenth placeholder issue',
    publishedAt: '2026-03-04T08:00:00.000Z',
    excerpt: null,
    contentHtml: SAMPLE_BODY,
  },
  {
    slug: 'sample-issue-twelve',
    issueNumber: 12,
    title: '[SAMPLE] Twelfth placeholder issue',
    publishedAt: '2026-02-25T08:00:00.000Z',
    excerpt: '[SAMPLE] A longer placeholder excerpt, written to run past a single line so that the clamp and the spacing beneath it can both be judged in a list rather than guessed at.',
    contentHtml: LONG_BODY,
  },
  {
    slug: 'sample-issue-eleven',
    issueNumber: 11,
    title: '[SAMPLE] Eleventh placeholder issue',
    publishedAt: '2026-02-18T08:00:00.000Z',
    excerpt: '[SAMPLE] Placeholder excerpt.',
    contentHtml: SHORT_BODY,
  },
  {
    slug: 'sample-issue-ten',
    issueNumber: 10,
    title: '[SAMPLE] Tenth placeholder issue',
    publishedAt: '2026-02-11T08:00:00.000Z',
    excerpt: '[SAMPLE] Placeholder excerpt.',
    externalUrl: 'https://example.invalid/p/sample-issue-ten',
    contentHtml: SAMPLE_BODY,
  },
  {
    slug: 'sample-issue-nine',
    issueNumber: 9,
    title: '[SAMPLE] Ninth placeholder issue',
    publishedAt: '2026-02-04T08:00:00.000Z',
    excerpt: '[SAMPLE] Placeholder excerpt.',
    contentHtml: LONG_BODY,
  },
  {
    slug: 'sample-issue-eight',
    issueNumber: 8,
    title: '[SAMPLE] Eighth placeholder issue, with no body captured',
    // An issue synced from a summary-only feed. The page must render the
    // metadata and say the body is elsewhere rather than showing a blank.
    publishedAt: '2026-01-28T08:00:00.000Z',
    excerpt: '[SAMPLE] Placeholder excerpt. contentHtml is null on this one.',
    externalUrl: 'https://example.invalid/p/sample-issue-eight',
    contentHtml: null,
  },
  {
    slug: 'sample-issue-seven',
    issueNumber: 7,
    title: '[SAMPLE] Seventh placeholder issue',
    publishedAt: '2026-01-21T08:00:00.000Z',
    excerpt: '[SAMPLE] Placeholder excerpt.',
    contentHtml: SAMPLE_BODY,
  },
  {
    slug: 'sample-issue-six',
    issueNumber: 6,
    title: '[SAMPLE] Sixth placeholder issue, with an unusable date',
    // Deliberately unparseable. The formatter returns null and the UI omits
    // the date entirely — today's date is NEVER substituted. Keeping one of
    // these in the set is what makes that rule visible rather than theoretical.
    publishedAt: 'not-a-date',
    excerpt: '[SAMPLE] The date should be omitted on this one, not guessed.',
    contentHtml: SAMPLE_BODY,
  },
  {
    slug: 'sample-issue-five',
    issueNumber: 5,
    title: '[SAMPLE] Fifth placeholder issue',
    publishedAt: '2026-01-07T08:00:00.000Z',
    excerpt: '[SAMPLE] Placeholder excerpt.',
    contentHtml: LONG_BODY,
  },
  {
    slug: 'sample-issue-four',
    issueNumber: 4,
    title: '[SAMPLE] Fourth placeholder issue',
    publishedAt: '2025-12-17T08:00:00.000Z',
    excerpt: '[SAMPLE] Placeholder excerpt.',
    contentHtml: SAMPLE_BODY,
  },
  {
    slug: 'sample-issue-three',
    issueNumber: 3,
    title: '[SAMPLE] Third placeholder issue',
    publishedAt: '2025-12-10T08:00:00.000Z',
    excerpt: '[SAMPLE] Placeholder excerpt used to check how a summary wraps in list views.',
    contentHtml: SHORT_BODY,
  },
  {
    slug: 'sample-issue-two',
    issueNumber: 2,
    title: '[SAMPLE] Second placeholder issue',
    publishedAt: '2025-12-03T08:00:00.000Z',
    excerpt: '[SAMPLE] Placeholder excerpt.',
    externalUrl: 'https://example.invalid/p/sample-issue-two',
    contentHtml: SAMPLE_BODY,
  },
  {
    slug: 'sample-issue-one',
    issueNumber: 1,
    title: '[SAMPLE] First placeholder issue',
    publishedAt: '2025-11-26T08:00:00.000Z',
    excerpt: null,
    contentHtml: null,
  },
];

const fixtureIssues: Issue[] = rows.map((row) => ({
  slug: row.slug,
  issueNumber: row.issueNumber,
  title: row.title,
  publishedAt: row.publishedAt,
  excerpt: row.excerpt,
  externalUrl: row.externalUrl ?? null,
  coverImageUrl: null,
  tags: [],
  contentHtml: row.contentHtml ?? null,
}));

export const fixturesSource: ContentSource = {
  async listIssues(limit) {
    const summaries = fixtureIssues.map(({ contentHtml: _contentHtml, ...summary }) => summary);
    return typeof limit === 'number' ? summaries.slice(0, limit) : summaries;
  },

  async getIssue(slug) {
    return fixtureIssues.find((issue) => issue.slug === slug) ?? null;
  },
};
