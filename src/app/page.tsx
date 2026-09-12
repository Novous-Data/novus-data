import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';

import { ActionLink } from '@/components/action';
import { Container } from '@/components/container';
import { JsonLd } from '@/components/json-ld';
import { NeedsInput } from '@/components/needs-input';
import { StatusBadge } from '@/components/status-badge';
import { SubscribePanel } from '@/components/subscribe-panel';
import { TextLink } from '@/components/text-link';
import { coverageTopics } from '@/config/coverage';
import { publication } from '@/config/publication';
import type { Disruption, EntityExposure } from '@/lib/disruptions';
import { CATEGORY_LABELS, SEVERITY_LABELS, buildExposureMatrix, listDisruptions } from '@/lib/disruptions';
import type { IssueSummary } from '@/lib/content';
import { listIssues } from '@/lib/content';
import { absoluteUrl } from '@/lib/env';
import { formatIssueLabel, formatLongDate, formatShortDate } from '@/lib/format';
import { publicationJsonLd } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: publication.name,
  description: publication.description,
  alternates: { canonical: absoluteUrl('/') },
};

export default async function HomePage() {
  const [disruptions, issues, matrix] = await Promise.all([
    listDisruptions(),
    listIssues(3),
    buildExposureMatrix(),
  ]);

  const open = disruptions.filter((entry) => entry.status !== 'resolved');
  const [lead, ...rest] = open;
  const latestIssue = issues[0] ?? null;

  return (
    <>
      <JsonLd data={publicationJsonLd()} />

      {lead ? (
        <LeadDisruption disruption={lead} />
      ) : latestIssue ? (
        <LeadIssue issue={latestIssue} />
      ) : (
        <PreLaunchHero />
      )}

      {rest.length > 0 ? (
        <Container className="mt-20 sm:mt-28">
          <SectionHeading id="open">Also open</SectionHeading>
          <ul className="mt-6 border-b border-hairline">
            {rest.slice(0, 5).map((disruption) => (
              <li key={disruption.id} className="border-t border-hairline">
                <Link
                  href={`/disruptions/${disruption.id}`}
                  className="group grid gap-x-8 gap-y-2 px-2 py-5 transition-colors hover:bg-surface sm:grid-cols-[9rem_1fr] sm:px-3"
                >
                  <StatusBadge status={disruption.status} />
                  <div>
                    <h3 className="font-serif text-[1.1875rem] font-semibold text-fg transition-colors group-hover:text-link">
                      {disruption.title}
                    </h3>
                    <p className="mt-1.5 max-w-[62ch] text-[0.9375rem] text-muted">
                      {disruption.summary}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6">
            <TextLink href="/disruptions">The full register</TextLink>
          </p>
        </Container>
      ) : null}

      {matrix.rows.length > 0 ? (
        <Container className="mt-20 sm:mt-28">
          <SectionHeading id="exposure">Most exposed</SectionHeading>
          <p className="mt-3 max-w-measure text-muted">
            Companies and sectors that the open register currently reaches. Every assessment
            behind this states its mechanism and its source.
          </p>
          <ul className="mt-6 border-b border-hairline">
            {matrix.rows.slice(0, 6).map((row) => (
              <ExposureRow key={row.entity.id} row={row} />
            ))}
          </ul>
          <p className="mt-6">
            <TextLink href="/exposure">The full exposure chart</TextLink>
          </p>
        </Container>
      ) : null}

      {latestIssue && lead ? (
        <Container className="mt-20 sm:mt-28">
          <SectionHeading id="briefing">From {publication.newsletter.name}</SectionHeading>
          <p className="mt-3 max-w-measure text-muted">{publication.newsletter.description}</p>
          <div className="mt-6 border-t border-hairline pt-6">
            <p className="flex flex-wrap gap-x-8 gap-y-1 text-meta text-muted">
              {formatIssueLabel(latestIssue.issueNumber) ? (
                <span data-numeric>Issue {formatIssueLabel(latestIssue.issueNumber)}</span>
              ) : null}
              {formatLongDate(latestIssue.publishedAt) ? (
                <time dateTime={latestIssue.publishedAt}>
                  {formatLongDate(latestIssue.publishedAt)}
                </time>
              ) : null}
            </p>
            <h3 className="mt-3 max-w-[24ch] font-serif text-heading font-semibold text-fg">
              <Link
                href={`/briefings/${latestIssue.slug}`}
                className="transition-colors hover:text-link"
              >
                {latestIssue.title}
              </Link>
            </h3>
            {latestIssue.excerpt ? (
              <p className="mt-3 max-w-[62ch] text-muted">{latestIssue.excerpt}</p>
            ) : null}
          </div>
          <p className="mt-6">
            <TextLink href="/briefings">Every issue</TextLink>
          </p>
        </Container>
      ) : null}

      <Container className="mt-20 sm:mt-28">
        <SectionHeading id="coverage">What Novus Data watches</SectionHeading>
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
        {/* min-w-0 on the children: a grid item defaults to min-width:auto and
            will not shrink below its longest unbreakable word otherwise. */}
        <div className="grid gap-8 md:grid-cols-2 [&>*]:min-w-0">
          <SubscribePanel heading={`Subscribe to ${publication.newsletter.name}`} />
          <section className="border border-hairline bg-surface p-7 sm:p-10">
            <h2 className="font-serif text-heading font-semibold text-fg">
              {publication.alerts.name}
            </h2>
            <p className="mt-3 max-w-[52ch] text-muted">
              Notifications when the register changes. Not built yet.
            </p>
            <p className="mt-6">
              <TextLink href="/alerts">What it will and will not do</TextLink>
            </p>
          </section>
        </div>
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
 * The lead story is the most pressing open disruption, exactly as a news front
 * page leads with its biggest story. It refreshes itself from the register with
 * no hand-edit.
 */
function LeadDisruption({ disruption }: { disruption: Disruption }) {
  const updated = formatLongDate(disruption.updatedAt);

  return (
    <Container className="pt-14 sm:pt-24">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-meta text-muted">
        <StatusBadge status={disruption.status} />
        <span>{CATEGORY_LABELS[disruption.category]}</span>
        {updated ? (
          <span>
            Reviewed <time dateTime={disruption.updatedAt}>{updated}</time>
          </span>
        ) : null}
      </div>

      <h1 className="mt-6 max-w-[17ch] font-serif text-display font-semibold text-fg">
        {disruption.title}
      </h1>

      <p className="mt-7 max-w-[58ch] text-subhead text-muted">{disruption.summary}</p>

      <div className="mt-9 flex flex-wrap gap-4">
        <ActionLink href={`/disruptions/${disruption.id}`}>Read the analysis</ActionLink>
        {disruption.exposures.length > 0 ? (
          <ActionLink href="/exposure" variant="quiet">
            See who it reaches
          </ActionLink>
        ) : null}
      </div>

      <p className="mt-14 max-w-[60ch] border-t border-hairline pt-6 text-muted">
        {publication.description}
      </p>
    </Container>
  );
}

/** Register empty but the briefing has shipped — lead with the latest issue. */
function LeadIssue({ issue }: { issue: IssueSummary }) {
  const date = formatLongDate(issue.publishedAt);

  return (
    <Container className="pt-14 sm:pt-24">
      <p className="flex flex-wrap items-baseline gap-x-8 gap-y-1 text-meta text-muted">
        <span>Latest briefing</span>
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

/** Nothing published anywhere yet. A deliberate state, not a broken page. */
function PreLaunchHero() {
  return (
    <Container className="pt-14 sm:pt-24">
      <p className="text-meta text-muted">Before the first entry</p>

      <h1 className="mt-6 max-w-[26ch] font-serif text-display font-semibold text-fg">
        {publication.shortDescription}
      </h1>

      <p className="mt-8 max-w-[60ch] text-subhead text-muted">{publication.positioning}</p>

      <div className="mt-10 max-w-xl">
        <SubscribePanel heading="Subscribe before the first entry" />
      </div>

      <p className="mt-10">
        <TextLink href="/coverage">What Novus Data will watch</TextLink>
      </p>
    </Container>
  );
}

function ExposureRow({ row }: { row: EntityExposure }) {
  const asOf = [...row.byDisruption.values()]
    .map((exposure) => exposure.asOf)
    .sort()
    .at(-1);

  return (
    <li className="border-t border-hairline">
      <Link
        href={`/exposure#entity-${row.entity.id}`}
        className="group grid gap-x-6 gap-y-1 px-2 py-4 transition-colors hover:bg-surface sm:grid-cols-[1fr_auto] sm:px-3"
      >
        <div>
          <span className="block text-[1.0625rem] text-fg transition-colors group-hover:text-link">
            {row.entity.name}
          </span>
          <span className="mt-0.5 block text-meta text-muted">
            {row.entity.ticker ? `${row.entity.ticker} · ` : ''}
            {row.entity.sector}
          </span>
        </div>
        <div className="flex items-center gap-3 sm:justify-end">
          <span
            className="exposure-cell !min-h-0 h-3.5 w-6"
            data-severity={row.worstSeverity}
            aria-hidden="true"
          />
          <span className="text-meta text-muted">
            {SEVERITY_LABELS[row.worstSeverity]} ·{' '}
            <span data-numeric>{row.count}</span>{' '}
            {row.count === 1 ? 'disruption' : 'disruptions'}
            {asOf && formatShortDate(asOf) ? `, as of ${formatShortDate(asOf)}` : ''}
          </span>
        </div>
      </Link>
    </li>
  );
}

function SectionHeading({ children, id }: { children: ReactNode; id: string }) {
  return (
    <h2 id={id} className="font-serif text-heading font-semibold text-fg">
      {children}
    </h2>
  );
}
