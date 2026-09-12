import type { Metadata } from 'next';

import { Container } from '@/components/container';
import { NeedsInput } from '@/components/needs-input';
import { PageHeader } from '@/components/page-header';
import { SubscribePanel } from '@/components/subscribe-panel';
import { MailLink, TextLink } from '@/components/text-link';
import { publication } from '@/config/publication';
import { absoluteUrl, env } from '@/lib/env';

export const metadata: Metadata = {
  title: 'About',
  description: `Who writes ${publication.name}, what it covers and how each issue is produced.`,
  alternates: { canonical: absoluteUrl('/about') },
};

export default function AboutPage() {
  return (
    <>
      <PageHeader width="reading" title={`About ${publication.name}`} lede={publication.description} />

      <Container width="reading" className="mt-14 flex flex-col gap-14">
        <Section heading="Who it is for">
          <p>{publication.positioning}</p>
          <p>
            It is written for {publication.primaryReader}. It is also read by{' '}
            {joinWithAnd(publication.secondaryReaders)}.
          </p>
        </Section>

        <Section heading="What it covers">
          <p>
            Novus Data follows the physical and regulatory machinery of trade: shipping and
            freight, chokepoints, ports, trade policy, concentrated industrial inputs, the energy
            costs attached to moving goods, and the economic releases that describe all of it.
          </p>
          <p>
            <TextLink href="/coverage">
              Each topic is set out in full, with why it matters
            </TextLink>
            .
          </p>
        </Section>

        <Section heading="How it is produced">
          {publication.methodology.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
          {publication.cadence ? <p>Novus Data is published {publication.cadence}.</p> : null}
        </Section>

        <Section heading="Who writes it">
          {publication.author.name ? (
            <>
              <p>
                Novus Data is written by {publication.author.name}. I research and write every
                issue.
              </p>
              {publication.author.credentials.length > 0 ? (
                <ul className="flex list-none flex-col gap-2 border-t border-hairline pt-5">
                  {publication.author.credentials.map((fact) => (
                    <li key={fact} className="text-muted">
                      {fact}
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : (
            <p>
              Novus Data is written by <NeedsInput label="author name" />. Nothing is stated here
              about the author until there is something verifiable to state.
            </p>
          )}
        </Section>

        <Section heading="Contact">
          {env.contactEmail ? (
            <p>
              Corrections, questions and sources are welcome at{' '}
              <MailLink email={env.contactEmail} />.
              Corrections are the most useful thing you can send.
            </p>
          ) : (
            <p>
              <TextLink href="/contact">Contact details</TextLink> are on their own page.
            </p>
          )}
        </Section>
      </Container>

      <Container width="reading" className="mt-16">
        <SubscribePanel />
      </Container>
    </>
  );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-heading font-semibold text-fg">{heading}</h2>
      <div className="mt-4 flex max-w-measure flex-col gap-4 text-muted">{children}</div>
    </section>
  );
}

/** "a, b and c" — no Oxford comma, matching the rest of the site's prose. */
function joinWithAnd(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
