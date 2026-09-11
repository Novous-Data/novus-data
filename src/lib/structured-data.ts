/**
 * Structured data builders.
 *
 * Every field here has to be backed by something real. Where a value is not
 * available — no author name, no external URL — the key is left out entirely
 * rather than filled with a placeholder, because structured data is consumed
 * by machines that will repeat whatever it is told.
 */

import { publication } from '@/config/publication';
import type { Issue } from '@/lib/content';
import { absoluteUrl, env } from '@/lib/env';

type Json = Record<string, unknown>;

/** Drop keys whose value is null or undefined. */
function compact(input: Json): Json {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value != null));
}

export function publicationJsonLd(): Json {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: publication.name,
    description: publication.description,
    url: absoluteUrl('/'),
    email: env.contactEmail ?? undefined,
    founder: publication.author.name ? { '@type': 'Person', name: publication.author.name } : undefined,
    sameAs: [env.beehiivHomeUrl].filter((value): value is string => Boolean(value)),
  });
}

export function issueJsonLd(issue: Issue, canonicalUrl: string): Json {
  const publishedTime =
    issue.publishedAt && !Number.isNaN(new Date(issue.publishedAt).getTime())
      ? new Date(issue.publishedAt).toISOString()
      : undefined;

  return compact({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: issue.title,
    description: issue.excerpt ?? undefined,
    datePublished: publishedTime,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    author: publication.author.name
      ? { '@type': 'Person', name: publication.author.name }
      : undefined,
    publisher: { '@type': 'Organization', name: publication.name },
    image: issue.coverImageUrl ?? undefined,
    isPartOf: {
      '@type': 'Periodical',
      name: publication.name,
      url: absoluteUrl('/'),
    },
  });
}
