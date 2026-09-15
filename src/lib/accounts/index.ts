/**
 * The account layer's public API.
 *
 * Nothing in the site imports this yet, and that is correct: there is no
 * authentication, and `src/components/sign-in-panel.tsx` is a shell that sends
 * nothing anywhere. This layer exists so that when an identity provider is
 * wired up, the shape of an account, the storage contract and the rules about
 * what may never be stored are already settled and reviewed.
 *
 * Read `./types.ts` before implementing a backend. In short: no credential
 * field, nothing stored in this repository, do not write your own
 * authentication, and deletion ships with creation.
 */

export {
  ALERT_CHANNELS,
  DEFAULT_ALERT_PREFERENCES,
  EMPTY_WATCHLIST,
  looksLikeEmail,
  normaliseEmail,
  type Account,
  type AccountId,
  type AccountRepository,
  type AlertChannel,
  type AlertPreferences,
  type NewAccount,
  type Watchlist,
} from './types';

export {
  getAccountRepository,
  getAccountStoreName,
  isAccountStoreConfigured,
  type AccountStoreName,
} from './sources';
