/**
 * Chooses the account store, mirroring the two content layers' factories.
 *
 * The important difference: **the default is no store at all.** The issue and
 * register layers default to real local files because real content exists. No
 * account store exists, so the honest default is `none` — a repository that
 * throws a message naming what is missing, rather than one that quietly
 * accepts a signup and drops it.
 *
 * `ACCOUNT_STORE=supabase` is the real store; `ACCOUNT_STORE=memory` is a
 * development affordance only, and `./memory` refuses to load in a production
 * build.
 */

import type { AccountRepository } from '../types';

export type AccountStoreName = 'none' | 'memory' | 'supabase';

export function getAccountStoreName(): AccountStoreName {
  const value = process.env.ACCOUNT_STORE;
  if (value === 'supabase') return 'supabase';
  if (value === 'memory') return 'memory';
  return 'none';
}

export function isAccountStoreConfigured(): boolean {
  return getAccountStoreName() !== 'none';
}

/**
 * Resolved lazily and on the server only. The import is dynamic so that
 * `./memory` — which throws at module load in production — never enters a
 * bundle that has no intention of using it.
 */
export async function getAccountRepository(): Promise<AccountRepository> {
  const store = getAccountStoreName();

  if (store === 'supabase') {
    // All three imports are dynamic so that a build with no account store
    // never pulls the Supabase client — or, in admin's case, a module that
    // throws on sight of a misprefixed service key — into its graph.
    const [{ createSupabaseAccountRepository }, { createSupabaseServerClient }, admin] =
      await Promise.all([
        import('./supabase'),
        import('@/lib/supabase/server'),
        import('@/lib/supabase/admin'),
      ]);
    return createSupabaseAccountRepository(
      await createSupabaseServerClient(),
      admin.createSupabaseAdminClient,
    );
  }

  if (store === 'memory') {
    const { createMemoryAccountRepository } = await import('./memory');
    return createMemoryAccountRepository();
  }

  throw new Error(
    'No account store is configured. Novus Data has no authentication yet: the sign-in ' +
      'panel is a shell, and this repository is a static site with no database. ' +
      'Set ACCOUNT_STORE=supabase with a configured project (see DEPLOY.md Part 4), ' +
      'or ACCOUNT_STORE=memory for local development against a throwaway store.',
  );
}
