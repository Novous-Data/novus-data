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
  /**
   * The home page's opening claim. Not a fact about the world that needs a
   * source — a description of how modern production works.
   */
  openingLine: string;
  /** The paragraph beneath it, explaining the interconnection. */
  openingBody: string;
  /** Why Novus Data exists, in one sentence. Used on / and /about. */
  mission: string;
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
  /** The email briefing. One part of the site, not the whole of it. */
  newsletter: {
    name: string;
    /** One sentence on what the email is, as distinct from the site. */
    description: string;
  };
  /** The alerts app, which does not exist yet. Copy must not imply it does. */
  alerts: {
    name: string;
    /** Null until there is a date worth announcing. */
    availableFrom: string | null;
  };
  /**
   * How mistakes are handled. On a site that names companies this is not
   * boilerplate — it is the thing that makes the rest of it credible.
   */
  corrections: string[];
  /** Shown in the footer and on /about. Not legal advice; a plain statement. */
  disclaimer: string;
}

export const publication: Publication = {
  name: 'Novus Data',

  description:
    'Novus Data tracks disruption in global supply chains, shipping and trade policy, and shows which companies it reaches.',

  shortDescription: 'Supply chain disruption, tracked, and the companies it reaches.',

  openingLine: 'Nothing is made in one place any more.',

  openingBody:
    'A drought at a canal, a strike at a terminal, a licence withheld on one processed metal — none of it stays where it happens. It travels through the ships, ports, contracts and inventories that every business now sits downstream of, and it surfaces somewhere far from where it started, usually as a cost, a delay or a missed quarter. Novus Data follows it the whole way: from the disruption, to the lane, to the company.',

  mission:
    'To make disruption in physical trade legible to the people it reaches — early enough to act on, and sourced well enough to trust.',

  positioning:
    'Physical trade breaks before prices move. Novus Data keeps a register of what is going wrong across the shipping lanes, ports, chokepoints and trade rules that carry the world’s goods — and maps each problem to the companies and sectors it reaches, with the mechanism and the source stated every time.',

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

  methodology: [
    'Everything starts from primary sources wherever they exist: canal and port authority notices, customs and trade statistics, regulatory texts and official releases, and the filings and announcements of the companies involved. Trade press and carrier commentary are used to find stories, not to settle them.',
    'Every entry in the register carries the date it was last reviewed, and every company or sector named against a disruption carries three things: the mechanism by which the problem reaches it, how confident that assessment is, and at least one source you can follow. An assessment that cannot supply all three is not published — it is dropped by the site itself, not left to editorial discretion.',
    'The work is reading rather than modelling. Novus Data does not run a proprietary dataset and does not publish forecasts dressed as numbers. Where something is uncertain, it is marked as inferred or estimated rather than stated flatly.',
    'The standard is deliberately awkward to meet. It is easy to write that a company is "exposed" to a problem; it is much harder to say by what mechanism, how well established that is, and when it was last checked. Requiring all of it means the chart fills slowly — and that anything on it is worth the space it takes.',
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

  newsletter: {
    name: 'The Novus Data Briefing',
    description:
      'A written round-up of what moved in the register, sent by email. The site is the record; the briefing is the summary.',
  },

  alerts: {
    name: 'Novus Data Alerts',
    // No date is announced until one is real.
    availableFrom: null,
  },

  corrections: [
    'If something here is wrong, it gets corrected rather than quietly edited. A correction to a register entry is made on the entry itself, the review date is updated, and what changed is stated in the briefing that follows.',
    'Assessments are withdrawn as readily as they are published. If the evidence behind an exposure stops holding, the exposure is removed from the chart — a claim is only as good as the source under it, and there is no benefit to defending one that has stopped being true.',
    'Corrections are the most useful thing a reader can send, and they are read first.',
  ],

  disclaimer:
    'Novus Data publishes analysis and commentary, not investment advice. Nothing here is a recommendation to buy or sell any security.',
};
