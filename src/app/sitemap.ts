import type { MetadataRoute } from 'next';

import { footerNav } from '@/config/nav';
import { listIssues } from '@/lib/content';
import { listDisruptions } from '@/lib/disruptions';
import { absoluteUrl } from '@/lib/env';
import { toDate } from '@/lib/format';

/**
 * Derived, not listed. Static routes come from the navigation config and issue
 * routes come from the archive, so publishing an issue or adding a page needs
 * no edit here (Rule 6).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [issues, disruptions] = await Promise.all([listIssues(), listDisruptions()]);

  // The Set is what keeps this correct now that the navigation itself carries a
  // Home entry: '/' is listed first so the home page leads the sitemap whether
  // or not the nav happens to include it, and never twice.
  const staticRoutes: MetadataRoute.Sitemap = [
    ...new Set(['/', ...footerNav.map((item) => item.href)]),
  ]
    // /debug is development-only and 404s in production, so it is never listed.
    .filter((href) => !href.startsWith('/debug'))
    .map((href) => ({
      url: absoluteUrl(href),
      changeFrequency:
        href === '/' || href === '/disruptions' || href === '/exposure' || href === '/briefings'
          ? 'weekly'
          : 'monthly',
      priority: href === '/' ? 1 : href === '/disruptions' || href === '/exposure' ? 0.9 : 0.7,
    }));

  const issueRoutes: MetadataRoute.Sitemap = issues.map((issue) => {
    const published = toDate(issue.publishedAt);
    return {
      url: absoluteUrl(`/briefings/${issue.slug}`),
      // Real dates only. An unparseable one is omitted rather than faked.
      ...(published ? { lastModified: published } : {}),
      changeFrequency: 'yearly' as const,
      priority: 0.8,
    };
  });

  const disruptionRoutes: MetadataRoute.Sitemap = disruptions.map((disruption) => {
    const reviewed = toDate(disruption.updatedAt);
    return {
      url: absoluteUrl(`/disruptions/${disruption.id}`),
      ...(reviewed ? { lastModified: reviewed } : {}),
      // A live register entry changes as it is re-reviewed.
      changeFrequency: disruption.status === 'resolved' ? ('yearly' as const) : ('weekly' as const),
      priority: 0.9,
    };
  });

  return [...staticRoutes, ...disruptionRoutes, ...issueRoutes];
}
