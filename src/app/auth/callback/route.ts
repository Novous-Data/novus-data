import { NextResponse, type NextRequest } from 'next/server';

import { accountsConfigured } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * Where a magic link lands.
 *
 * The emailed link carries a one-time code. Exchanging it here — server side —
 * is what sets the session cookie. The code is single-use and short-lived, so
 * a link that has already been opened, or has expired, fails closed and the
 * reader is sent back to sign in again rather than to a broken page.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // `next` decides where the reader lands after signing in. It is attacker
  // controllable — it arrives in a URL — so only a same-site path is honoured.
  // Without this check, a crafted link could carry somebody straight off to
  // another origin immediately after authenticating.
  const requested = searchParams.get('next') ?? '/account';
  const destination = requested.startsWith('/') && !requested.startsWith('//')
    ? requested
    : '/account';

  if (!accountsConfigured()) {
    return NextResponse.redirect(`${origin}/?signin=unavailable`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/?signin=missing-code`);
  }

  const { createSupabaseServerClient } = await import('@/lib/supabase/server');
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Deliberately unspecific to the reader: a link that has been used, has
    // expired, or was never valid all look the same from outside.
    return NextResponse.redirect(`${origin}/?signin=link-expired`);
  }

  return NextResponse.redirect(`${origin}${destination}`);
}
