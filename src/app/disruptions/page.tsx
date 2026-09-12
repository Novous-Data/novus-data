import type { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/container';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { TextLink } from '@/components/text-link';
import { CATEGORY_LABELS, isStale, listDisruptions } from '@/lib/disruptions';
import { absoluteUrl } from '@/lib/env';
import { formatShortDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Disruptions',
  description:
    'The register of tracked supply chain disruptions: what is going wrong, where, how far along it is, and when each entry was last reviewed.',
  alternates: { canonical: absoluteUrl('/disruptions') },
};

export default async function DisruptionsPage() {
  const disruptions = await listDisruptions();

  return (
    <>
      <PageHeader
        title="Disruptions"
        lede="The register: what is going wrong in physical trade right now, and how far along each problem is."
      />

      <Container className="mt-12">
        {disruptions.length === 0 ? (
          <EmptyRegister />
        ) : (
          <ul className="border-b border-hairline">
            {disruptions.map((disruption) => {
              const updated = formatShortDate(disruption.updatedAt);
              const stale = isStale(disruption.updatedAt);

              return (
                <li key={disruption.id} className="border-t border-hairline">
                  <Link
                    href={`/disruptions/${disruption.id}`}
                    className="group grid gap-x-8 gap-y-3 px-2 py-6 transition-colors hover:bg-surface sm:grid-cols-[9rem_1fr] sm:px-3"
                  >
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 sm:block">
                      <StatusBadge status={disruption.status} />
                      <span className="block text-meta text-muted sm:mt-2">
                        {CATEGORY_LABELS[disruption.category]}
                      </span>
                    </div>

                    <div>
                      <h2 className="font-serif text-[1.3125rem] font-semibold leading-snug text-fg transition-colors group-hover:text-link sm:text-[1.375rem]">
                        {disruption.title}
                      </h2>
                      <p className="mt-2 max-w-[62ch] text-[0.9375rem] text-muted">
                        {disruption.summary}
                      </p>
                      <p className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-meta text-muted">
                        {updated ? (
                          <span>
                            Reviewed <time dateTime={disruption.updatedAt}>{updated}</time>
                            {stale ? ' — not reviewed recently' : ''}
                          </span>
                        ) : null}
                        <span data-numeric>
                          {disruption.exposures.length}{' '}
                          {disruption.exposures.length === 1 ? 'name affected' : 'names affected'}
                        </span>
                        <span data-numeric>
                          {disruption.sources.length}{' '}
                          {disruption.sources.length === 1 ? 'source' : 'sources'}
                        </span>
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Container>

      {disruptions.length > 0 ? (
        <Container className="mt-10">
          <p className="max-w-measure text-muted">
            <TextLink href="/exposure">See all of this as one chart</TextLink> — every tracked
            problem against every company it reaches.
          </p>
        </Container>
      ) : null}
    </>
  );
}

function EmptyRegister() {
  return (
    <div className="max-w-reading">
      <p className="text-muted">
        Nothing is in the register yet. Entries appear here as disruptions are tracked, and each
        one carries the date it was last reviewed, the companies and sectors it reaches, and the
        sources behind every claim.
      </p>
      <p className="mt-4 text-muted">
        <TextLink href="/coverage">What Novus Data watches for</TextLink>.
      </p>
    </div>
  );
}
