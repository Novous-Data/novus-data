import type { NextConfig } from 'next';

/**
 * Response headers applied to every route.
 *
 * There is deliberately no Content-Security-Policy here. A CSP that
 * accommodates issue images from a newsletter CDN — a host that changes
 * without notice — needs testing against real traffic, and a CSP that is
 * slightly wrong breaks the site silently. It is recorded as a Phase 2 item
 * in HANDOFF.md instead of being guessed at now.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },

  // Slugs are permanent URLs. If one ever has to change, add the old path here
  // so the original link keeps working.
  async redirects() {
    return [];
  },
};

export default nextConfig;
