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
 * The `INPUT_LEDGER` below records where each fact came from. A fact marked
 * `assumed` was drafted from the project description and still needs the
 * author's confirmation; a fact marked `unanswered` is `null` and the site
 * renders around its absence instead of filling the gap.
 */

/** How much confidence there is in a given fact. */
export type Provenance =
  /** Supplied by the author. Safe to publish. */
  | 'confirmed'
  /** Drafted from the project description. Needs confirmation before launch. */
  | 'assumed'
  /** Not supplied. The value is `null` and the site omits the claim. */
  | 'unanswered';

export interface InputRecord {
  /** Dotted path into `publication`, or the environment variable name. */
  key: string;
  provenance: Provenance;
  /** Which pages stop being correct if this is wrong. */
  usedOn: string[];
  /** What to do about it. */
  note: string;
  /** A production build fails while this is still unanswered. */
  requiredForLaunch: boolean;
}

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

/**
 * The state of every input the site depends on. Keep this honest — it is the
 * checklist that decides whether the site is ready to publish, it drives
 * /debug/content in development, and it is the reason no page has to guess.
 */
export const INPUT_LEDGER: InputRecord[] = [
  {
    key: 'publication.description',
    provenance: 'assumed',
    usedOn: ['/', '/about', 'site metadata', 'social cards'],
    note: 'Drafted from the project description. Confirm the wording — it appears in search results and on every shared link.',
    requiredForLaunch: false,
  },
  {
    key: 'publication.positioning',
    provenance: 'assumed',
    usedOn: ['/', '/about'],
    note: 'Drafted. Rewrite in the author’s own words if it does not sound like them.',
    requiredForLaunch: false,
  },
  {
    key: 'publication.methodology',
    provenance: 'assumed',
    usedOn: ['/about'],
    note: 'Drafted. This is a claim about how the work is actually done, so read it line by line and correct anything that is not true yet.',
    requiredForLaunch: false,
  },
  {
    key: 'publication.primaryReader / secondaryReaders',
    provenance: 'assumed',
    usedOn: ['/about', '/coverage'],
    note: 'Drafted from the project description. /coverage explains each topic to these readers specifically, so getting them right changes that page.',
    requiredForLaunch: false,
  },
  {
    key: 'publication.cadence',
    provenance: 'unanswered',
    usedOn: ['/', '/subscribe'],
    note: 'Null. The subscribe blocks currently state no schedule. Set it only once a schedule is genuinely being kept.',
    requiredForLaunch: false,
  },
  {
    key: 'publication.firstIssueDate',
    provenance: 'unanswered',
    usedOn: ['/ (pre-launch state only)'],
    note: 'Null. The pre-launch hero announces no date. Ignored entirely once the archive has issues.',
    requiredForLaunch: false,
  },
  {
    key: 'publication.author.name',
    provenance: 'unanswered',
    usedOn: ['/about', 'JSON-LD author', 'issue bylines'],
    note: 'Not supplied. A production build fails while this is null, because an about page with no author defeats the point of the site.',
    requiredForLaunch: true,
  },
  {
    key: 'publication.author.credentials',
    provenance: 'unanswered',
    usedOn: ['/about'],
    note: 'Empty. /about states what is verifiable and nothing more. Add only facts that are true and checkable today.',
    requiredForLaunch: false,
  },
  {
    key: 'publication.discloseStudentStatus',
    provenance: 'confirmed',
    usedOn: ['/about'],
    note: 'False, the documented default. Nothing on the site mentions age, school or student status.',
    requiredForLaunch: false,
  },
  {
    key: 'coverage topics (src/config/coverage.ts)',
    provenance: 'assumed',
    usedOn: ['/', '/coverage'],
    note: 'Seven topics drafted from the project description. Cut, reorder or rewrite freely — /coverage and the home page both read from that one file.',
    requiredForLaunch: false,
  },
  {
    key: 'NEXT_PUBLIC_BEEHIIV_SUBSCRIBE_URL',
    provenance: 'unanswered',
    usedOn: ['/', '/subscribe', 'every subscribe block', 'footer'],
    note: 'Not supplied. Subscribe controls render disabled with an explicit "not configured" note rather than linking nowhere.',
    requiredForLaunch: true,
  },
  {
    key: 'NEXT_PUBLIC_BEEHIIV_HOME_URL / NEXT_PUBLIC_BEEHIIV_FEED_URL',
    provenance: 'unanswered',
    usedOn: ['footer', '/privacy'],
    note: 'Not supplied. Those footer links are omitted rather than guessed.',
    requiredForLaunch: false,
  },
  {
    key: 'NEXT_PUBLIC_CONTACT_EMAIL',
    provenance: 'unanswered',
    usedOn: ['/contact', '/about', 'footer'],
    note: 'Not supplied. /contact explains that no address is configured yet instead of printing a mailto that goes nowhere.',
    requiredForLaunch: true,
  },
  {
    key: 'NEXT_PUBLIC_SITE_URL',
    provenance: 'unanswered',
    usedOn: ['canonical URLs', 'sitemap', 'social card URLs'],
    note: 'Falls back to $VERCEL_URL then localhost, so previews are correct. Set it on Vercel once the real domain exists.',
    requiredForLaunch: false,
  },
  {
    key: 'BEEHIIV_RSS_URL',
    provenance: 'unanswered',
    usedOn: ['scripts/sync-issues.ts only — never read by the site'],
    note: 'Not supplied, so the archive could not be populated and the feed could not be inspected. Until it is set, npm run sync-issues exits with an error.',
    requiredForLaunch: false,
  },
  {
    key: 'logo file',
    provenance: 'unanswered',
    usedOn: ['header wordmark', 'icons', 'social cards'],
    note: 'Not supplied, so the wordmark is set typographically in Source Serif 4 and the icons are generated from the same treatment. The real logo should replace this — see HANDOFF.md.',
    requiredForLaunch: false,
  },
];

/** Inputs still missing that must be answered before the site goes live. */
export function missingLaunchInputs(): InputRecord[] {
  const unresolved: InputRecord[] = [];

  for (const record of INPUT_LEDGER) {
    if (!record.requiredForLaunch) continue;
    if (record.key === 'publication.author.name' && publication.author.name) continue;
    if (
      record.key === 'NEXT_PUBLIC_BEEHIIV_SUBSCRIBE_URL' &&
      process.env.NEXT_PUBLIC_BEEHIIV_SUBSCRIBE_URL
    ) {
      continue;
    }
    if (record.key === 'NEXT_PUBLIC_CONTACT_EMAIL' && process.env.NEXT_PUBLIC_CONTACT_EMAIL) {
      continue;
    }
    unresolved.push(record);
  }

  return unresolved;
}

/**
 * Refuses to produce a production build while a launch-critical fact is still
 * missing. `npm run preview` sets NOVUS_ALLOW_INCOMPLETE=1 so the site can be
 * reviewed in its unfinished state; a real deployment does not set it, so
 * Vercel fails with a list of exactly what to fill in.
 *
 * Deliberately loud. Silently shipping an about page with no author is the
 * failure mode this whole file exists to prevent.
 */
function assertLaunchReady(): void {
  if (process.env.NODE_ENV !== 'production') return;
  if (process.env.NOVUS_ALLOW_INCOMPLETE === '1') return;

  const missing = missingLaunchInputs();
  if (missing.length === 0) return;

  const lines = missing.map((record) => `  - ${record.key}\n      ${record.note}`);
  throw new Error(
    [
      '',
      'Novus Data cannot build for production yet. These inputs are still missing:',
      '',
      ...lines,
      '',
      'Fill them in (src/config/publication.ts for facts, .env.local or the Vercel',
      'dashboard for environment variables), or set NOVUS_ALLOW_INCOMPLETE=1 to build',
      'an intentionally unfinished preview.',
      '',
    ].join('\n'),
  );
}

assertLaunchReady();
