import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

import { requireSupabaseEnv } from '@/lib/env';

/**
 * The Supabase client for server components, route handlers and server
 * actions. It reads the session from cookies, so it acts as the signed-in
 * reader and every query it makes is subject to row-level security.
 *
 * `cookies()` is async in this version of Next — awaiting it is what makes
 * the calling route dynamic, which is exactly why only account routes call
 * this. The register, the chart, the entity pages and the briefings never
 * touch it and stay statically prerendered.
 */
export async function createSupabaseServerClient() {
  const { url, anonKey } = requireSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a server component, where cookies are read-only.
          // proxy.ts refreshes the session on every request, so there is
          // nothing to recover here — swallowing this is the documented
          // pattern, not an oversight.
        }
      },
    },
  });
}
