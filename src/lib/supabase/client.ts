'use client';

import { createBrowserClient } from '@supabase/ssr';

import { requireSupabaseEnv } from '@/lib/env';

/**
 * The browser client. Used by the sign-in panel to request a magic link.
 *
 * It carries only the anon key, which is meant to be public: the row-level
 * security policies decide what this client can see, not the secrecy of the
 * key. Nothing here can read another reader's rows.
 */
export function createSupabaseBrowserClient() {
  const { url, anonKey } = requireSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
