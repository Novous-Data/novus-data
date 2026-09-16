/**
 * Who is signed in, for server components and server actions.
 *
 * Kept out of `./index.ts` on purpose: this module reaches for `cookies()`
 * through the Supabase server client, and anything that imports it becomes
 * request-scoped and therefore dynamic. The index stays importable from
 * anywhere, and `./types.ts` stays pure enough for a client component — the
 * same split §6a documents for the register layer.
 */

import { accountsConfigured } from '@/lib/env';

import { getAccountRepository } from './sources';
import type { Account } from './types';

/**
 * The signed-in reader's account, or null.
 *
 * Returns null — never throws — when accounts are not configured at all, so a
 * page can render its pre-launch state on a deployment with no Supabase
 * project rather than falling into the error boundary.
 */
export async function getCurrentAccount(): Promise<Account | null> {
  if (!accountsConfigured()) return null;

  const { createSupabaseServerClient } = await import('@/lib/supabase/server');
  const client = await createSupabaseServerClient();

  // getUser() revalidates the token against Supabase rather than trusting the
  // cookie. getSession() would be faster and is not safe on the server: the
  // cookie is attacker-supplied until something verifies it.
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;

  const repository = await getAccountRepository();
  return repository.findById(data.user.id);
}

/** The reader's id alone, when the full account is not needed. */
export async function getCurrentAccountId(): Promise<string | null> {
  if (!accountsConfigured()) return null;
  const { createSupabaseServerClient } = await import('@/lib/supabase/server');
  const client = await createSupabaseServerClient();
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}
