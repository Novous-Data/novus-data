import type { Metadata } from 'next';

import { ActionLink } from '@/components/action';
import { Container } from '@/components/container';
import { JsonLd } from '@/components/json-ld';
import { IssueList } from '@/components/issue-list';
import { NeedsInput } from '@/components/needs-input';
import { SubscribePanel } from '@/components/subscribe-panel';
import { TextLink } from '@/components/text-link';
import { coverageTopics } from '@/config/coverage';
import { publication } from '@/config/publication';
import { listIssues } from '@/lib/content';
import { absoluteUrl } from '@/lib/env';
import { formatIssueLabel, formatLongDate } from '@/lib/format';
import { publicationJsonLd } from '@/lib/structured-data';

export const metadata: Metadata = {
  // The home page title is the publication name alone, not "Home — Novus Data".
  title: publication.name,
  description: publication.description,
  alternates: { canonical: absoluteUrl('/') },
};

/** The hero is the latest issue, plus five more below it. */
const HOME_ISSUE_COUNT = 6;

export default async function HomePage() {
  const issues = await listIssues(HOME_ISSUE_COUNT);
  const [latest, ...recent] = issues;

  return (
    <>
      <JsonLd data={publicationJsonLd()} />

      {latest ? <LatestBriefingHero issue={latest} /> : <PreLaunchHero />}

      {recent.length > 0 ? (
        <Container className="mt-20 sm:mt-28">
          <SectionHeading id="recent">Recent briefings</SectionHeading>
          <div className="mt-6">
            <IssueList issues={recent} label="Recent briefings" />
          </div>
          <p className="mt-6">
            <TextLink href="/briefings">Read the full archive</TextLink>
          </p>
        </Container>
      ) : null}

      <Container className="mt-20 sm:mt-28">
        <SectionHeading id="coverage">What Novus Data follows</SectionHeading>
        <dl className="mt-6 grid gap-x-14 md:grid-cols-2">
          {coverageTopics.map((topic) => (
            <div key={topic.id} className="border-t border-hairline py-5">
              <dt className="font-serif text-[1.1875rem] font-semibold text-fg">{topic.title}</dt>
              <dd className="mt-1.5 max-w-[52ch] text-[0.9375rem] text-muted">{topic.summary}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6">
          <TextLink href="/coverage">Why each of these matters</TextLink>
        </p>
      </Container>

      <Container className="mt-20 sm:mt-28">
        <SubscribePanel />
      </Container>

      <Container className="mt-16">
        <p className="max-w-[56ch] text-muted">
          {publication.author.name ? (
            <>Novus Data is written by {publication.author.name}. </>
          ) : (
            <>
              Novus Data is written by <NeedsInput label="author name" />.{' '}
            </>
          )}
          <TextLink href="/about">How it is produced</TextLink>.
        </p>
      </Container>
    </>
  );
}

/**
 * The strongest credibility signal available is a real, dated, current issue,
 * so the page opens with one. It refreshes itself every time an issue is
 * synced — no hand-edit, ever.
 */
function LatestBriefingHero({
  issue,
}: {
  issue: Awaited<ReturnType<typeof listIssues>>[number];
}) {
  const date = formatLongDate(issue.publishedAt);
  const number = formatIssueLabel(issue.issueNumber);

  return (
    <Container className="pt-14 sm:pt-24">
      <p className="flex flex-wrap items-baseline gap-x-8 gap-y-1 text-meta text-muted">
        <span>Latest briefing</span>
        {number ? <span data-numeric>Issue {number}</span> : null}
        {date ? <time dateTime={issue.publishedAt}>{date}</time> : null}
      </p>

      <h1 className="mt-6 max-w-[17ch] font-serif text-display font-semibold text-fg">
        {issue.title}
      </h1>

      {issue.excerpt ? (
        <p className="mt-7 max-w-[58ch] text-subhead text-muted">{issue.excerpt}</p>
      ) : null}

      <div className="mt-9">
        <ActionLink href={`/briefings/${issue.slug}`}>Read this briefing</ActionLink>
      </div>

      <p className="mt-14 max-w-[60ch] border-t border-hairline pt-6 text-muted">
        {publication.description}
      </p>
    </Container>
  );
}

/**
 * Shown while content/issues/ is empty. A deliberate pre-launch state, not a
 * broken archive: it states what the publication is and how to subscribe, and
 * announces a date only if one has actually been set.
 */
function PreLaunchHero() {
  const firstIssue = formatLongDate(publication.firstIssueDate);

  return (
    <Container className="pt-14 sm:pt-24">
      <p className="text-meta text-muted">Before the first issue</p>

      {/* The short line carries the display treatment; the full description
          would run to eight lines at this size and stop reading as a statement. */}
      <h1 className="mt-6 max-w-[26ch] font-serif text-display font-semibold text-fg">
        {publication.shortDescription}
      </h1>

      <p className="mt-8 max-w-[60ch] text-subhead text-muted">{publication.positioning}</p>

      {firstIssue ? (
        <p className="mt-7 max-w-[60ch] text-muted">
          The first issue is published on <time dateTime={publication.firstIssueDate ?? undefined}>{firstIssue}</time>.
        </p>
      ) : null}

      <div className="mt-10 max-w-xl">
        <SubscribePanel heading="Subscribe before the first issue" />
      </div>

      <p className="mt-10">
        <TextLink href="/coverage">What Novus Data will cover</TextLink>
      </p>
    </Container>
  );
}

function SectionHeading({ children, id }: { children: string; id: string }) {
  return (
    <h2 id={id} className="font-serif text-heading font-semibold text-fg">
      {children}
    </h2>
  );
}
