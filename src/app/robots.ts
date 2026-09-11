import type { MetadataRoute } from 'next';

import { absoluteUrl } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Development-only inspection route. It 404s in production anyway; this
      // keeps it out of crawl queues regardless.
      disallow: '/debug/',
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
