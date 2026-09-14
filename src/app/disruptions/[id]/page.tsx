import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Container } from '@/components/container';
import { JsonLd } from '@/components/json-ld';
import { ProseBody } from '@/components/prose-body';
import { StatusBadge } from '@/components/status-badge';
import { ExternalLink, TextLink } from '@/components/text-link';
import type { Exposure, Source } from '@/lib/disruptions';
import {
  CATEGORY_LABELS,
  CONFIDENCE_LABELS,
  CONFIDENCE_NOTES,
  SEVERITY_LABELS,
  STALE_AFTER_DAYS,
  getDisruption,
  isStale,
  listDisruptionIds,
} from '@/lib/disruptions';
import { absoluteUrl } from '@/lib/env';
import { formatLongDate, formatShortDate } from '@/lib/format';
import { disruptionJsonLd } from '@/lib/structured-data';

export async function generateStaticParams() {
  const ids = await listDisruptionIds();
  return ids.map((id) => ({ id }));
}

export const dynamicParams = false;

export async function generateMetadata(props: PageProps<'/disruptions/[id]'>): Promise<Metadata> {
  const { id } = await props.params;
  const disruption = await getDisruption(id);
  if (!disruption) return { title: 'Disruption not found' };

  return {
    title: disruption.title,
    description: disruption.summary,
    alternates: { canonical: absoluteUrl(`/disruptions/${disruption.id}`) },
    openGraph: {
      type: 'article',
      title: disruption.title,
      description: disruption.summary,
      url: absoluteUrl(`/disruptions/${disruption.id}`),
    },
  };
}

export default async function DisruptionPage(props: PageProps<'/disruptions/[id]'>) {
  const { id } = await props.params;
  const disruption = await getDisruption(id);
  if (!disruption) notFound();

  const started = formatLongDate(disruption.startedAt);
  const updated = formatLongDate(disruption.updatedAt);
  const stale = isStale(disruption.updatedAt);

  return (
    <article>
      <JsonLd
        data={disruptionJsonLd(disruption, absoluteUrl(`/disruptions/${disruption.id}`))}
      />

      <Container width="reading" className="pt-12 sm:pt-20">
        <p className="text-meta text-muted">
          <TextLink href="/disruptions" className="no-underline hover:underline">
            Disruptions
          </TextLink>
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
          <StatusBadge status={disruption.status} />
          <span className="text-meta text-muted">{CATEGORY_LABELS[disruption.category]}</span>
        </div>

        <h1 className="mt-4 font-serif text-title font-semibold text-fg">{disruption.title}</h1>

        <p className="mt-6 max-w-measure text-subhead text-muted">{disruption.summary}</p>

        <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-3 border-t border-hairline pt-5 text-meta">
          {started ? (
            <div>
              <dt className="text-muted">Began</dt>
              <dd className="mt-0.5 text-fg">
                <time dateTime={disruption.startedAt}>{started}</time>
              </dd>
            </div>
          ) : null}
          {updated ? (
            <div>
              <dt className="text-muted">Last reviewed</dt>
              <dd className="mt-0.5 text-fg">
                <time dateTime={disruption.updatedAt}>{updated}</time>
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-muted">Names affected</dt>
            <dd data-numeric className="mt-0.5 text-fg">
              {disruption.exposures.length}
            </dd>
          </div>
        </dl>

        {/* An assessment that has not been looked at recently says so, rather
            than presenting itself as current.

            Phrased against the build rather than against "now" on purpose: the
            page is static, so a day count rendered here would freeze at build
            time and could only ever understate the age. The absolute review
            date above is the figure that stays true. */}
        {stale ? (
          <p className="mt-6 border-l-2 border-status-active pl-4 text-meta text-muted">
            This entry had not been reviewed for over{' '}
            <span data-numeric>{STALE_AFTER_DAYS}</span> days when this page was built, and may
            have aged further since. Trust the review date above, not the freshness of the page.
          </p>
        ) : null}
      </Container>

      {disruption.contentHtml ? (
        <Container width="reading" className="mt-12">
          <ProseBody html={disruption.contentHtml} />
        </Container>
      ) : null}

      <Container width="reading" className="mt-16">
        <h2 className="font-serif text-heading font-semibold text-fg">Who this reaches</h2>
        <p className="mt-3 max-w-measure text-muted">
          Each entry states how the disruption reaches that company or sector, how well
          established the assessment is, and where it comes from.
        </p>

        {disruption.exposures.length === 0 ? (
          <p className="mt-6 max-w-measure text-muted">
            No exposure has been established yet. Nothing is listed here until the mechanism,
            confidence, date and source behind it all exist.
          </p>
        ) : (
          <ul className="mt-8 flex flex-col">
            {disruption.exposures.map((exposure) => (
              <ExposureEntry key={exposure.entity.id} exposure={exposure} />
            ))}
          </ul>
        )}

        <p className="mt-8">
          <TextLink href="/exposure">See this alongside every other tracked disruption</TextLink>
        </p>
      </Container>

      <Container width="reading" className="mt-16">
        <h2 className="font-serif text-heading font-semibold text-fg">Sources</h2>
        <SourceList sources={disruption.sources} className="mt-5" />
      </Container>

      <Container width="reading" className="mt-16">
        <p className="max-w-measure text-meta text-muted">
          Novus Data publishes analysis and commentary, not investment advice. Nothing here is a
          recommendation to buy or sell any security.
        </p>
      </Container>
    </article>
  );
}

/** Anchored by entity id, so a chart cell can link straight to its own claim. */
function ExposureEntry({ exposure }: { exposure: Exposure }) {
  const asOf = formatShortDate(exposure.asOf);

  return (
    <li id={`entity-${exposure.entity.id}`} className="border-t border-hairline py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="text-[1.0625rem] font-medium text-fg">{exposure.entity.name}</h3>
        <p className="text-meta text-muted">
          {exposure.entity.ticker ? `${exposure.entity.ticker} · ` : ''}
          {exposure.entity.sector}
        </p>
      </div>

      <p className="mt-3 max-w-measure text-muted">{exposure.mechanism}</p>

      <dl className="mt-4 flex flex-wrap gap-x-10 gap-y-2 text-meta">
        <div className="flex items-center gap-2">
          <dt className="text-muted">Severity</dt>
          <dd className="flex items-center gap-2 text-fg">
            <span
              className="exposure-cell !min-h-0 h-3.5 w-6"
              data-severity={exposure.severity}
              data-confidence={exposure.confidence}
              aria-hidden="true"
            />
            {SEVERITY_LABELS[exposure.severity]}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-muted">Confidence</dt>
          <dd className="text-fg" title={CONFIDENCE_NOTES[exposure.confidence]}>
            {CONFIDENCE_LABELS[exposure.confidence]}
          </dd>
        </div>
        {asOf ? (
          <div className="flex items-center gap-2">
            <dt className="text-muted">As of</dt>
            <dd data-numeric className="text-fg">
              <time dateTime={exposure.asOf}>{asOf}</time>
            </dd>
          </div>
        ) : null}
      </dl>

      <p className="mt-3 text-meta text-muted">{CONFIDENCE_NOTES[exposure.confidence]}</p>

      <SourceList sources={exposure.sources} className="mt-4" compact />
    </li>
  );
}

function SourceList({
  sources,
  className,
  compact,
}: {
  sources: Source[];
  className?: string;
  compact?: boolean;
}) {
  // Each citation is a line of running text with a link in it, so the link is
  // inline prose rather than a standalone control — which is why it is marked
  // up as a paragraph and not padded out to a 44px target.
  return (
    <ol className={className}>
      {sources.map((source, index) => (
        <li key={source.url} className={compact ? undefined : 'border-t border-hairline py-3'}>
          <p className={compact ? 'text-[0.8125rem] leading-relaxed' : undefined}>
            <span data-numeric className="mr-2 text-muted">
              {index + 1}.
            </span>
            <ExternalLink href={source.url}>{source.title}</ExternalLink>
            <span className="text-muted">
              {' '}
              — {source.publisher}
              {source.retrievedAt && formatShortDate(source.retrievedAt)
                ? `, read ${formatShortDate(source.retrievedAt)}`
                : ''}
            </span>
          </p>
        </li>
      ))}
    </ol>
  );
}
