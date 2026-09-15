/**
 * Development-only content source.
 *
 * Active only when CONTENT_SOURCE=fixtures. Every title is prefixed [SAMPLE]
 * so that a fixture reaching a screenshot, a share preview or a deployment is
 * unmistakable, and the module refuses to load in a production build at all.
 *
 * Rule 1 forbids fabricated content anywhere it could reach production. This
 * file is the single, deliberately fenced exception.
 */

import type { ContentSource, Issue } from '../types';

if (process.env.NODE_ENV === 'production' && process.env.CONTENT_SOURCE === 'fixtures') {
  throw new Error(
    'CONTENT_SOURCE=fixtures must never be used for a production build. ' +
      'Fixture issues are placeholder text and would publish as if they were real briefings. ' +
      'Set CONTENT_SOURCE=local (or leave it unset).',
  );
}

const SAMPLE_BODY = `
<p>[SAMPLE] Placeholder body text used to check typography, measure and spacing on the issue template. It is not a briefing and states nothing about the world.</p>
<h2>[SAMPLE] A second-level heading</h2>
<p>[SAMPLE] A second paragraph, long enough to wrap several times so that line height, measure and paragraph spacing can be judged at something close to real reading length rather than on a single short line.</p>
<ul><li>[SAMPLE] A list item</li><li>[SAMPLE] Another list item</li></ul>
<blockquote><p>[SAMPLE] A block quotation, for checking the quotation treatment.</p></blockquote>
`.trim();

const fixtureIssues: Issue[] = [
  {
    slug: 'sample-issue-three',
    issueNumber: 3,
    title: '[SAMPLE] Third placeholder issue',
    publishedAt: '2026-03-18T08:00:00.000Z',
    excerpt: '[SAMPLE] Placeholder excerpt used to check how a summary wraps in list views.',
    externalUrl: null,
    coverImageUrl: null,
    tags: [],
    contentHtml: SAMPLE_BODY,
  },
  {
    slug: 'sample-issue-two',
    issueNumber: 2,
    title: '[SAMPLE] Second placeholder issue with a deliberately long title to test wrapping',
    publishedAt: '2026-03-11T08:00:00.000Z',
    excerpt: '[SAMPLE] Placeholder excerpt.',
    externalUrl: 'https://example.invalid/p/sample-issue-two',
    coverImageUrl: null,
    tags: [],
    contentHtml: SAMPLE_BODY,
  },
  {
    slug: 'sample-issue-one',
    issueNumber: 1,
    title: '[SAMPLE] First placeholder issue',
    publishedAt: '2026-03-04T08:00:00.000Z',
    excerpt: null,
    externalUrl: null,
    coverImageUrl: null,
    tags: [],
    contentHtml: null,
  },
];

export const fixturesSource: ContentSource = {
  async listIssues(limit) {
    const summaries = fixtureIssues.map(({ contentHtml: _contentHtml, ...summary }) => summary);
    return typeof limit === 'number' ? summaries.slice(0, limit) : summaries;
  },

  async getIssue(slug) {
    return fixtureIssues.find((issue) => issue.slug === slug) ?? null;
  },
};
