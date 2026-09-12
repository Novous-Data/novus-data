import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Container } from '@/components/container';
import { ProseBody } from '@/components/prose-body';
import { JsonLd } from '@/components/json-ld';
import { SubscribePanel } from '@/components/subscribe-panel';
import { ExternalLink, TextLink } from '@/components/text-link';
import { publication } from '@/config/publication';
import type { IssueSummary } from '@/lib/content';
import { getIssue, getIssueNeighbours, listIssueSlugs } from '@/lib/content';
import { absoluteUrl } from '@/lib/env';
import { formatIssueLabel, formatLongDate, readingTimeMinutes } from '@/lib/format';
import { issueJsonLd } from '@/lib/structured-data';

/**
 * Every issue is a file in this repository, so the full slug list is known at
 * build time and every issue page is prerendered. A build with no network
 * access still produces the complete site.
 */
export async function generateStaticParams() {
  const slugs = await listIssueSlugs();
  return slugs.map((slug) => ({ slug }));
}

/** An unknown slug is a 404, not an empty article shell. */
export const dynamicParams = false;

/**
 * The newsletter is published by email first, so where an issue exists on the
 * sending platform that copy is canonical. Where it does not — a hand-written
 * issue, or anything published after leaving Beehiiv — this page is canonical.
 */
function canonicalFor(issue: { slug: string; externalUrl: string | null }): string {
  return issue.externalUrl ?? absoluteUrl(`/briefings/${issue.slug}`);
}

export async function generateMetadata(
  props: PageProps<'/briefings/[slug]'>,
): Promise<Metadata> {
  const { slug } = await props.params;
  const issue = await getIssue(slug);

  if (!issue) {
    return { title: 'Briefing not found' };
  }

  const published =
    issue.publishedAt && !Number.isNaN(new Date(issue.publishedAt).getTime())
      ? new Date(issue.publishedAt).toISOString()
      : undefined;

  return {
    title: issue.title,
    description: issue.excerpt ?? publication.description,
    alternates: { canonical: canonicalFor(issue) },
    openGraph: {
      type: 'article',
      title: issue.title,
      description: issue.excerpt ?? publication.description,
      url: absoluteUrl(`/briefings/${issue.slug}`),
      publishedTime: published,
    },
    twitter: {
      card: 'summary_large_image',
      title: issue.title,
      description: issue.excerpt ?? publication.description,
    },
  };
}

export default async function IssuePage(props: PageProps<'/briefings/[slug]'>) {
  const { slug } = await props.params;
  const issue = await getIssue(slug);

  if (!issue) notFound();

  const { previous, next } = await getIssueNeighbours(slug);
  const date = formatLongDate(issue.publishedAt);
  const number = formatIssueLabel(issue.issueNumber);
  // A real measurement of the stored text. Omitted entirely when there is no
  // body to measure, rather than defaulted to something.
  const minutes = readingTimeMinutes(issue.contentHtml);

  return (
    <article>
      <JsonLd data={issueJsonLd(issue, canonicalFor(issue))} />

      <Container width="reading" className="pt-12 sm:pt-20">
        <p className="text-meta text-muted">
          <TextLink href="/briefings" className="no-underline hover:underline">
            Briefings
          </TextLink>
        </p>

        <h1 className="mt-6 font-serif text-title font-semibold text-fg">{issue.title}</h1>

        {issue.excerpt ? (
          <p className="mt-6 max-w-measure text-subhead text-muted">{issue.excerpt}</p>
        ) : null}

        {/* A rule here divides the metadata from the body — it is dividing two
            real things, which is the only reason this site draws a rule. */}
        <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-3 border-t border-hairline pt-5 text-meta">
          {number ? (
            <div>
              <dt className="text-muted">Issue</dt>
              <dd data-numeric className="mt-0.5 text-fg">
                {number}
              </dd>
            </div>
          ) : null}
          {date ? (
            <div>
              <dt className="text-muted">Published</dt>
              <dd className="mt-0.5 text-fg">
                <time dateTime={issue.publishedAt}>{date}</time>
              </dd>
            </div>
          ) : null}
          {minutes !== null ? (
            <div>
              <dt className="text-muted">Reading time</dt>
              <dd data-numeric className="mt-0.5 text-fg">
                {minutes} min
              </dd>
            </div>
          ) : null}
        </dl>
      </Container>

      {issue.coverImageUrl ? (
        <Container width="reading" className="mt-10">
          <CoverImage src={issue.coverImageUrl} />
        </Container>
      ) : null}

      <Container width="reading" className="mt-12">
        {issue.contentHtml ? (
          <ProseBody html={issue.contentHtml} />
        ) : (
          <p className="max-w-measure text-muted">
            The text of this issue is not stored here.
            {issue.externalUrl ? (
              <>
                {' '}
                <ExternalLink href={issue.externalUrl}>Read it on Beehiiv</ExternalLink>.
              </>
            ) : null}
          </p>
        )}

        {issue.externalUrl ? (
          <p className="mt-12 max-w-measure text-meta text-muted">
            Originally published on{' '}
            <ExternalLink href={issue.externalUrl}>Beehiiv</ExternalLink>.
          </p>
        ) : null}
      </Container>

      <Container width="reading" className="mt-16">
        <SubscribePanel heading="Get the next briefing by email" tone="plain" />
      </Container>

      {previous || next ? (
        <Container width="reading" className="mt-16">
          <nav aria-label="More briefings" className="border-t border-hairline pt-8">
            {/* Position encodes direction: earlier on the left, later on the
                right. No arrow glyphs. */}
            <div className="grid gap-8 sm:grid-cols-2">
              <AdjacentIssue issue={previous} label="Previous briefing" align="start" />
              <AdjacentIssue issue={next} label="Next briefing" align="end" />
            </div>
          </nav>
        </Container>
      ) : null}
    </article>
  );
}

function AdjacentIssue({
  issue,
  label,
  align,
}: {
  issue: IssueSummary | null;
  label: string;
  align: 'start' | 'end';
}) {
  if (!issue) return <div aria-hidden="true" />;

  return (
    <div className={align === 'end' ? 'sm:text-right' : undefined}>
      <p className="text-meta text-muted">{label}</p>
      <Link
        href={`/briefings/${issue.slug}`}
        className="mt-1 inline-flex min-h-11 items-center font-serif text-[1.125rem] font-semibold text-fg transition-colors hover:text-link"
      >
        {issue.title}
      </Link>
    </div>
  );
}

/**
 * Issue images come from whatever CDN the sending platform uses, and that host
 * changes without notice. Routing them through next/image would require a
 * remotePatterns allowlist that fails silently the day the host changes, so
 * they stay plain <img> with native lazy loading. The lint rule is disabled
 * here and nowhere else.
 */
function CoverImage({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      className="w-full border border-hairline"
    />
  );
}
