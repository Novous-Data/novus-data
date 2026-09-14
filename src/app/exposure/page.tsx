import type { Metadata } from 'next';

import { Container } from '@/components/container';
import { ExposureChart } from '@/components/exposure-chart';
import { PageHeader } from '@/components/page-header';
import { TextLink } from '@/components/text-link';
import { buildExposureMatrix } from '@/lib/disruptions';
import { absoluteUrl } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Exposure',
  description:
    'Which tracked supply chain disruptions reach which companies and sectors, with the mechanism, the confidence and the source behind every assessment.',
  alternates: { canonical: absoluteUrl('/exposure') },
};

export default async function ExposurePage() {
  const matrix = await buildExposureMatrix();

  return (
    <>
      <PageHeader
        title="Exposure"
        lede="Which tracked disruptions reach which companies, and how they reach them."
      />

      <Container className="mt-10">
        <div className="max-w-reading">
          <p className="text-muted">
            Each cell is one assessment: a disruption from the register set against a company or
            sector. The fill is how hard it lands; the edge is how well established it is. Select
            a cell for the disruption behind it.
          </p>
          <p className="mt-4 text-muted">
            <strong className="font-medium text-fg">
              A cell only exists if the claim behind it can be checked.
            </strong>{' '}
            The site refuses to render an assessment that does not state the mechanism, how
            confident it is, the date it was last true, and at least one source you can follow.
            That is enforced in code, not by editorial habit. The full standard — what each
            confidence level means, how the severity scale is defined, and when an assessment is
            treated as too old — is written out under{' '}
            <TextLink href="/about#method">how this is produced</TextLink>.
          </p>
          <p className="mt-4 text-meta text-muted">
            This is analysis, not investment advice, and not a recommendation about any security.
          </p>
        </div>
      </Container>

      <Container className="mt-12">
        <ExposureChart matrix={matrix} />
      </Container>

      <Container className="mt-16">
        <p className="max-w-measure text-muted">
          Disagree with an assessment, or know of an exposure that is missing?{' '}
          <TextLink href="/contact">Send it with a source</TextLink> — corrections are the most
          useful thing you can send.
        </p>
      </Container>
    </>
  );
}
