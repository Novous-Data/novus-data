import type { Metadata } from 'next';

import { Container } from '@/components/container';
import { PageHeader } from '@/components/page-header';
import { ExternalLink, TextLink } from '@/components/text-link';
import { publication } from '@/config/publication';
import { absoluteUrl, env } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Privacy',
  description: `What ${publication.name} does and does not collect.`,
  alternates: { canonical: absoluteUrl('/privacy') },
};

/*
 * TODO (must be reviewed by the publisher before the custom domain goes live):
 * This page is a plain description of how the site actually behaves today. It
 * is deliberately not drafted as a legal privacy policy, and it has not been
 * reviewed by anyone qualified to write one. If analytics, embeds, a comment
 * system or any third-party script is ever added, this page stops being
 * accurate the moment that change ships. See HANDOFF.md.
 */
export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        title="Privacy"
        lede="What this site does with information, described plainly."
      />

      <Container width="reading" className="mt-12 flex flex-col gap-10">
        <Section heading="This site">
          <p>
            The pages of this site are static files. They set no cookies, run no analytics, embed
            no tracking pixels and load no third-party scripts. Nothing you do while reading is
            recorded by Novus Data.
          </p>
          <p>
            The site is hosted on Vercel, which keeps standard server logs of requests, including
            IP addresses, in the ordinary course of serving a website. Novus Data does not read
            those logs to identify readers.
          </p>
        </Section>

        <Section heading="The sign-in form">
          <p>
            There is a sign-in panel on the home page. It does nothing yet: there are no accounts,
            it has no server behind it, and it makes no network request at all. Anything typed
            into it stays in your browser and is discarded when you leave the page — it is never
            sent, never stored and never logged.
          </p>
          <p>
            It exists so the signed-in experience can be designed before it is built. When
            accounts are real, this page will be rewritten in the same release to describe exactly
            what is held and why — not afterwards.
          </p>
        </Section>

        <Section heading="Subscribing">
          <p>
            Subscribing happens on Beehiiv, not here. When you subscribe, your email address goes
            to Beehiiv, which sends the newsletter, stores the subscriber list and handles
            unsubscribes. Beehiiv&rsquo;s privacy policy governs what happens to it from that
            point, and its terms are between you and Beehiiv.
          </p>
          <p>
            <ExternalLink href="https://www.beehiiv.com/privacy">
              Beehiiv&rsquo;s privacy policy
            </ExternalLink>
          </p>
          <p>Every issue includes an unsubscribe link. Unsubscribing removes you from the list.</p>
        </Section>

        <Section heading="Email you send">
          {env.contactEmail ? (
            <p>
              If you email {publication.name}, that message and your address sit in an ordinary
              email account. They are not added to the subscriber list, and they are not shared.
            </p>
          ) : (
            <p>
              No contact address is published yet. When one is, mail sent to it will sit in an
              ordinary email account and will not be added to the subscriber list.
            </p>
          )}
        </Section>

        <Section heading="Changes">
          <p>
            If this site ever adds analytics, an embedded form or anything else that collects
            information, this page will be updated before that change goes live.
          </p>
          <p>
            Questions about any of this can go to{' '}
            <TextLink href="/contact">the contact page</TextLink>.
          </p>
        </Section>
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
