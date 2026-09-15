import { NextResponse, type NextRequest } from 'next/server';

import { accountsConfigured } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * Sign out. POST only.
 *
 * A GET would mean any link, image or prefetch could sign a reader out, and
 * browsers prefetch links. Anything that changes state takes a POST.
 */
export async function POST(request: NextRequest) {
  const { origin } = new URL(request.url);

  if (accountsConfigured()) {
    const { createSupabaseServerClient } = await import('@/lib/supabase/server');
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(`${origin}/`, { status: 303 });
}
