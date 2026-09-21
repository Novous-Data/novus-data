import type { NextConfig } from 'next';

/**
 * Response headers applied to every route.
 *
 * ---------------------------------------------------------------------------
 * The Content-Security-Policy is REPORT-ONLY, and that is the whole point.
 * ---------------------------------------------------------------------------
 *
 * The earlier note here said a CSP could not be written yet, because issue
 * images come from a newsletter CDN whose host is not known until issues are
 * synced, and a policy that is slightly wrong breaks the site silently.
 *
 * That reasoning is right about an ENFORCING policy and wrong about this one.
 * `Content-Security-Policy-Report-Only` blocks nothing. The browser evaluates
 * the policy, loads the page exactly as it would have anyway, and logs what
 * *would* have been refused. So it is the tool for precisely the situation
 * that comment describes: it discovers the unknown hosts instead of guessing
 * them. Tighten it and switch to the enforcing header once the reports are
 * quiet against real traffic.
 *
 * Two deliberate loosenings, both worth understanding before anyone tightens
 * them:
 *
 *   script-src 'unsafe-inline' — Next injects an inline bootstrap script on
 *   every page. The correct fix is a per-request nonce, which requires
 *   generating one in the proxy and threading it through. That would make
 *   every page dynamic, and this site's static rendering is a stated
 *   architectural rule (CLAUDE.md §13). A nonce-based CSP and a fully static
 *   site are in genuine tension here; the static site wins for now.
 *
 *   img-src has no CDN host, because no issue has been synced yet and the
 *   host is therefore unknown. This is the value the report-only run exists
 *   to discover. Expect violations here the day the first issue lands, and
 *   add the host the reports name — do not pre-emptively widen it to https:.
 *
 * There is no report-uri or report-to: collecting reports needs an endpoint
 * that accepts POSTs, and this repository has no backend by design. The
 * violations appear in the browser console, which is enough to read them
 * during review.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  // Matches the X-Frame-Options: SAMEORIGIN below. Both are set because
  // frame-ancestors supersedes the older header only where CSP is enforced,
  // and this policy is not enforcing yet.
  "frame-ancestors 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  // Google Fonts serves the stylesheet from one host and the font files from
  // another; both are needed or the type falls back mid-page.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  // Only reached when ACCOUNT_STORE=supabase; harmless otherwise.
  "connect-src 'self' https://*.supabase.co",
  // `upgrade-insecure-requests` is deliberately absent: the spec says it is
  // ignored in a report-only policy, and Chrome logs a warning about it on
  // every page load. That noise would bury the violations this policy exists
  // to surface. Add it in the same change that switches to the enforcing
  // header, where it actually does something.
].join('; ');
const securityHeaders = [
  { key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicy },
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
