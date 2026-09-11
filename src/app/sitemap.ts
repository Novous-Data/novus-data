import type { MetadataRoute } from 'next';

import { footerNav } from '@/config/nav';
import { listIssues } from '@/lib/content';
import { absoluteUrl } from '@/lib/env';
import { toDate } from '@/lib/format';

/**
 * Derived, not listed. Static routes come from the navigation config and issue
 * routes come from the archive, so publishing an issue or adding a page needs
 * no edit here (Rule 6).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const issues = await listIssues();

  const staticRoutes: MetadataRoute.Sitemap = ['/', ...footerNav.map((item) => item.href)]
    // /debug is development-only and 404s in production, so it is never listed.
    .filter((href) => !href.startsWith('/debug'))
    .map((href) => ({
      url: absoluteUrl(href),
      changeFrequency: href === '/' || href === '/briefings' ? 'weekly' : 'monthly',
      priority: href === '/' ? 1 : 0.7,
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

  return [...staticRoutes, ...issueRoutes];
}
