/**
 * Every fact the site states about Novus Data and its author lives in this
 * file. Nothing factual is written inline in a page component.
 *
 * Why it is built this way
 * -----------------------
 * Rule 1 of the build brief forbids fabricated facts, and Rule 6 forbids
 * hand-edits when something changes. Centralising the facts satisfies both:
 * there is exactly one place to correct a claim, and a claim that has not
 * been supplied is `null` rather than invented.
 *
 * `INPUT_LEDGER` in ./input-ledger.ts records where each fact came from. A
 * fact marked `assumed` was drafted from the project description and still
 * needs the author's confirmation; a fact marked `unanswered` is `null` and the
 * site renders around its absence instead of filling the gap.
 *
 * This module is deliberately free of side effects, because it is imported by a
 * client component (the wordmark). The build-time readiness check that used to
 * live here now lives in ./input-ledger.ts, which only server code imports —
 * running a module-load assertion in the browser crashes hydration, which is
 * exactly what happened before it was moved.
 */

export interface AuthorProfile {
  /** Name exactly as it should appear in print. */
  name: string | null;
  /**
   * Short, verifiable, checkable-today statements. Nothing forthcoming,
   * nothing aspirational, no institutional affiliation that does not exist.
   * Rendered as sentences on /about, in order.
   */
  credentials: string[];
}

export interface Publication {
  name: string;
  /** One sentence. The single most repeated line on the site. */
  description: string;
  /** A few words for the footer, where the full sentence would repeat the page. */
  shortDescription: string;
  /** Slightly longer positioning paragraph, used on / and /about. */
  positioning: string;
  primaryReader: string;
  secondaryReaders: string[];
  /**
   * Publishing cadence as an adverb ("weekly", "twice a month"), or null if
   * no cadence has been fixed. When null the site never claims a schedule.
   */
  cadence: string | null;
  /**
   * ISO date of the first issue, used only in the pre-launch state, and only
   * when the archive is empty. Null means the site announces no date.
   */
  firstIssueDate: string | null;
  /**
   * How an issue is produced. Rendered as consecutive paragraphs on /about.
   * This is a claim about working method, so it has to be true — edit it to
   * match what actually happens rather than leaving a flattering draft.
   */
  methodology: string[];
  author: AuthorProfile;
  /**
   * Whether the site may mention the author's age, school, grade or student
   * status. This is the author's decision, not the site's. Default false.
   */
  discloseStudentStatus: boolean;
  /** Shown in the footer and on /about. Not legal advice; a plain statement. */
  disclaimer: string;
}

export const publication: Publication = {
  name: 'Novus Data',

  description:
    'Novus Data is a research briefing on global supply chains, shipping and trade policy, and what disruption in them means for markets.',

  shortDescription: 'Supply chains, shipping and trade policy, read for what they mean for markets.',

  positioning:
    'Physical trade breaks before prices move. Novus Data follows the shipping lanes, ports, chokepoints and trade rules that carry the world’s goods, and reports what a disruption is likely to reach next — which sectors, which costs, which margins.',

  primaryReader:
    'investors and analysts who need to know how a disruption in physical trade reaches prices, earnings and risk',

  secondaryReaders: [
    'procurement and logistics managers who plan around freight cost and transit time',
    'operators and founders whose landed costs move with shipping',
    'anyone following trade policy closely enough to need the detail',
  ],

  // Section 0 left this blank. The site therefore never states a schedule.
  // Set it to e.g. 'weekly' once a cadence is actually being held to.
  cadence: null,

  // Only used when content/issues/ is empty. Null means no date is announced.
  firstIssueDate: null,

  methodology: [
    'Each issue starts from primary sources wherever they exist: canal and port authority notices, customs and trade statistics, regulatory texts and official releases, and the filings and announcements of the companies involved. Trade press and carrier commentary are used to find stories, not to settle them.',
    'The work is reading rather than modelling. Novus Data does not run a proprietary dataset, and it does not publish forecasts dressed as numbers. Where a figure appears in an issue it is sourced and linked, and where something is uncertain the issue says so.',
    'Novus Data publishes analysis and commentary. It is not investment advice, it is not a recommendation to buy or sell any security, and it is not a substitute for your own work.',
  ],

  author: {
    // NOT SUPPLIED. A production build refuses to run while this is null —
    // see assertLaunchReady() below. Fill it in before deploying.
    name: null,
    // Only statements that are true and checkable today belong here.
    credentials: [],
  },

  // Default is false and stays false unless the author says otherwise.
  // See the build brief, section 12.2: this is a strategic decision that
  // belongs to the author.
  discloseStudentStatus: false,

  disclaimer:
    'Novus Data publishes analysis and commentary, not investment advice. Nothing here is a recommendation to buy or sell any security.',
};
