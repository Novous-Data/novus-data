/**
 * An in-process account repository, for developing the signed-in experience
 * before an identity provider exists.
 *
 * Three things make it safe to have in the tree:
 *
 *   1. **It never persists.** State is a `Map` in one Node process. A restart
 *      empties it, and two serverless invocations do not share it. There is no
 *      file, no directory and nothing to accidentally `git add`.
 *   2. **It refuses to load in a production build.** Same guard as the two
 *      fixture sources — an account store that forgets everything would be a
 *      worse lie than having no accounts at all.
 *   3. **It rejects credentials at runtime.** The `Account` type has nowhere
 *      to put a secret, but a value crossing a network boundary is `unknown`
 *      until something checks it. `create()` throws if the input carries a
 *      credential-shaped key rather than storing it and hoping.
 *
 * When real accounts arrive this file is deleted, not extended. Its purpose is
 * to prove the interface in `../types.ts` is the right one.
 */

import {
  DEFAULT_ALERT_PREFERENCES,
  EMPTY_WATCHLIST,
  looksLikeEmail,
  normaliseEmail,
  type Account,
  type AccountId,
  type AccountRepository,
  type AlertPreferences,
  type NewAccount,
  type Watchlist,
} from '../types';

if (process.env.NODE_ENV === 'production') {
  throw new Error(
    'The in-memory account repository must never be used in a production build. ' +
      'It keeps accounts in one process and loses them on restart. ' +
      'Leave ACCOUNT_STORE unset, or point it at a real service.',
  );
}

/**
 * Key names that must never appear on an account record. Checked at runtime
 * because TypeScript stops at the compiler and real input arrives as JSON.
 */
const FORBIDDEN_KEYS = [
  'password',
  'passwordhash',
  'passwd',
  'pass',
  'hash',
  'salt',
  'secret',
  'apisecret',
  'apikey',
  'token',
  'accesstoken',
  'refreshtoken',
  'sessiontoken',
  'credential',
  'credentials',
  'pin',
  'otp',
  'mfasecret',
  'totpsecret',
  'privatekey',
];

function assertNoCredentialFields(input: object, where: string): void {
  for (const key of Object.keys(input)) {
    if (FORBIDDEN_KEYS.includes(key.toLowerCase().replace(/[^a-z]/g, ''))) {
      throw new Error(
        `${where}: refusing a "${key}" field. Accounts in this system hold no secrets — ` +
          'authentication belongs to the identity provider. See src/lib/accounts/types.ts.',
      );
    }
  }
}

/** Stored records are copied in and out so a caller cannot mutate the store. */
function clone(account: Account): Account {
  return {
    ...account,
    watchlist: {
      entityIds: [...account.watchlist.entityIds],
      categories: [...account.watchlist.categories],
    },
    alerts: { ...account.alerts, channels: [...account.alerts.channels] },
  };
}

function dedupe<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function createMemoryAccountRepository(seed: Account[] = []): AccountRepository {
  const byId = new Map<AccountId, Account>();
  const idByEmail = new Map<string, AccountId>();

  function index(account: Account): void {
    byId.set(account.id, account);
    idByEmail.set(account.email, account.id);
  }

  for (const account of seed) {
    assertNoCredentialFields(account, 'Seeding an account');
    index(clone(account));
  }

  return {
    async findById(id) {
      const found = byId.get(id);
      return found ? clone(found) : null;
    },

    async findByEmail(email) {
      const id = idByEmail.get(normaliseEmail(email));
      if (id === undefined) return null;
      const found = byId.get(id);
      return found ? clone(found) : null;
    },

    async create(input: NewAccount) {
      assertNoCredentialFields(input, 'Creating an account');

      const id = input.id.trim();
      if (id.length === 0) {
        throw new Error('Creating an account: id is required and comes from the identity provider.');
      }
      if (byId.has(id)) {
        throw new Error(`Creating an account: id "${id}" already exists.`);
      }

      const email = normaliseEmail(input.email);
      if (!looksLikeEmail(email)) {
        throw new Error(`Creating an account: "${input.email}" is not a usable email address.`);
      }
      if (idByEmail.has(email)) {
        // One address, one account. Otherwise alerts double up and deletion
        // leaves a record the reader does not know about.
        throw new Error(`Creating an account: an account already exists for that address.`);
      }

      const displayName = input.displayName?.trim();
      const account: Account = {
        id,
        email,
        displayName: displayName && displayName.length > 0 ? displayName : null,
        createdAt: new Date().toISOString(),
        watchlist: { ...EMPTY_WATCHLIST, entityIds: [], categories: [] },
        alerts: { ...DEFAULT_ALERT_PREFERENCES, channels: [] },
      };

      index(account);
      return clone(account);
    },

    async updateWatchlist(id: AccountId, watchlist: Watchlist) {
      const existing = byId.get(id);
      if (!existing) return null;

      const updated: Account = {
        ...existing,
        watchlist: {
          entityIds: dedupe(watchlist.entityIds.map((value) => value.trim()).filter(Boolean)),
          categories: dedupe(watchlist.categories),
        },
      };
      index(updated);
      return clone(updated);
    },

    async updatePreferences(id: AccountId, preferences: AlertPreferences) {
      const existing = byId.get(id);
      if (!existing) return null;

      const updated: Account = {
        ...existing,
        alerts: { ...preferences, channels: dedupe(preferences.channels) },
      };
      index(updated);
      return clone(updated);
    },

    async deleteAccount(id: AccountId) {
      const existing = byId.get(id);
      if (!existing) return false;
      // Remove the record outright. A deleted account leaves nothing behind,
      // including the email index that would otherwise still prove it existed.
      byId.delete(id);
      idByEmail.delete(existing.email);
      return true;
    },
  };
}
