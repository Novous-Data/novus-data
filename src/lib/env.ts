/**
 * Environment access, in one place.
 *
 * Two things to know before editing:
 *
 * 1. `process.env.NEXT_PUBLIC_*` must be written out literally. Next.js
 *    inlines these at build time by static analysis, so `process.env[key]`
 *    silently yields undefined in the browser bundle. That is why this file
 *    reads each key by name instead of looping.
 *
 * 2. A missing optional value is `null`, never a placeholder string. Callers
 *    branch on null and omit the thing entirely — a footer link that is not
 *    configured does not render, rather than pointing at nowhere.
 */

/** Trim, and treat an empty or whitespace-only value as absent. */
function clean(value: string | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Drop a trailing slash so URLs can be composed without doubling it. */
function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

/**
 * Absolute origin of this deployment, resolved in the order the build brief
 * specifies so that preview deployments still produce correct absolute URLs:
 *
 *   NEXT_PUBLIC_SITE_URL  →  https://$VERCEL_URL  →  http://localhost:3000
 */
function resolveSiteUrl(): string {
  const explicit = clean(process.env.NEXT_PUBLIC_SITE_URL);
  if (explicit) {
    // metadataBase does `new URL(siteUrl)`. A value without a protocol — the
    // obvious thing to paste into a Vercel settings field — throws "Invalid
    // URL" from deep inside Next's metadata handling, with nothing naming the
    // variable. Fail here instead, saying which key is wrong and why.
    let parsed: URL;
    try {
      parsed = new URL(explicit);
    } catch {
      throw new Error(
        `NEXT_PUBLIC_SITE_URL is not a valid absolute URL: "${explicit}". ` +
          'It needs the protocol, e.g. https://novusdata.com — not novusdata.com.',
      );
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error(
        `NEXT_PUBLIC_SITE_URL must be http or https, got "${parsed.protocol}" in "${explicit}".`,
      );
    }
    return stripTrailingSlash(explicit);
  }

  // Vercel sets VERCEL_URL to a bare host with no protocol.
  const vercel = clean(process.env.VERCEL_URL);
  if (vercel) return stripTrailingSlash(`https://${vercel}`);

  return 'http://localhost:3000';
}

export const env = {
  /** Always a usable absolute origin, never null. No trailing slash. */
  siteUrl: resolveSiteUrl(),

  /** Whether siteUrl is a real configured value rather than a fallback. */
  siteUrlIsConfigured: clean(process.env.NEXT_PUBLIC_SITE_URL) !== null,

  /** Where the subscribe buttons point. Null disables them, visibly. */
  subscribeUrl: clean(process.env.NEXT_PUBLIC_BEEHIIV_SUBSCRIBE_URL),

  /** The Beehiiv publication homepage, linked from the footer. */
  beehiivHomeUrl: clean(process.env.NEXT_PUBLIC_BEEHIIV_HOME_URL),

  /** Beehiiv's RSS feed, offered to readers in the footer. */
  beehiivFeedUrl: clean(process.env.NEXT_PUBLIC_BEEHIIV_FEED_URL),

  /** Public contact address. Null means /contact says so plainly. */
  contactEmail: clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL),

  /** True only in `next dev`. Gates the /debug routes. */
  isDevelopment: process.env.NODE_ENV === 'development',

  /* ---------------------------------------------------------------------
     Accounts.

     The anon key is PUBLIC by design — it is meant to ship to browsers, and
     what protects the data is the row-level security policy on every table,
     not the secrecy of this string. The service role key is the opposite and
     is read in `src/lib/supabase/admin.ts`, never here, so that it cannot be
     reached from anything that also holds NEXT_PUBLIC_ values.
     --------------------------------------------------------------------- */

  /** Supabase project URL. Null means accounts are not configured. */
  supabaseUrl: clean(process.env.NEXT_PUBLIC_SUPABASE_URL),

  /** Publishable anon key. Safe in the browser; RLS is the actual guard. */
  supabaseAnonKey: clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
} as const;

/**
 * Whether a real account store is wired up.
 *
 * Every account-bearing surface checks this and degrades to the pre-launch
 * copy when it is false, so the site builds and deploys perfectly well with
 * no Supabase project at all — which is how it ships today.
 */
export function accountsConfigured(): boolean {
  return (
    process.env.ACCOUNT_STORE === 'supabase' &&
    env.supabaseUrl !== null &&
    env.supabaseAnonKey !== null
  );
}

/** Throws with a message naming the fix. Called by the Supabase clients. */
export function requireSupabaseEnv(): { url: string; anonKey: string } {
  const { supabaseUrl, supabaseAnonKey } = env;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'ACCOUNT_STORE=supabase needs NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY. Both are in your Supabase project settings, ' +
        'under Project Settings → API. See DEPLOY.md Part 4.',
    );
  }
  return { url: supabaseUrl, anonKey: supabaseAnonKey };
}

/** Absolute URL for a site-relative path, e.g. canonical and OG image URLs. */
export function absoluteUrl(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${env.siteUrl}${suffix}`;
}
