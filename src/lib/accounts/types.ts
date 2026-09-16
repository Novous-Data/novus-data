/**
 * The account layer: who a reader is, and what they follow.
 *
 * ---------------------------------------------------------------------------
 * READ THIS BEFORE IMPLEMENTING A REAL BACKEND
 *
 * 1. **There is no credential in this file, and there must never be one.**
 *    No `password`, no `passwordHash`, no `salt`, no `apiSecret`. An account
 *    here is a *reference* to an identity that an authentication provider
 *    owns — `id` is the opaque subject the provider issues. If you find
 *    yourself wanting to add a field to store a secret, the design has gone
 *    wrong: use the provider's session instead.
 *
 *    This is structural, not a convention. There is nowhere to put a password,
 *    so nobody can accidentally persist one.
 *
 * 2. **Nothing here may be stored in this repository.** This repo is a
 *    statically generated site under version control. Account records are
 *    personal data; a git history is permanent and widely readable. The
 *    repository implementation belongs in a service with a real database,
 *    reached over the network — see CLAUDE.md §14.2 for the shape.
 *
 * 3. **Do not write your own authentication.** Password hashing, session
 *    rotation, reset flows, rate limiting and breach response are a specialist
 *    job and the failure mode is other people's accounts. Use an established
 *    provider and keep this layer to what it is: preferences attached to an id
 *    that somebody else vouched for.
 *
 * 4. **Deletion is part of the contract, not a later feature.** `deleteAccount`
 *    is in the interface from the first version deliberately. A product that
 *    can create a record and cannot remove it is one you have to apologise for
 *    later.
 * ---------------------------------------------------------------------------
 */

import type { DisruptionCategory, Severity } from '@/lib/disruptions/types';

/**
 * The opaque subject identifier issued by the identity provider.
 *
 * Never an email address and never a sequential integer: an email changes and a
 * sequence leaks how many accounts exist and lets one be guessed from another.
 */
export type AccountId = string;

/** Where an alert could be delivered. None of these are built. */
export type AlertChannel = 'email' | 'push';

export const ALERT_CHANNELS: AlertChannel[] = ['email', 'push'];

/**
 * What a reader follows. This is the whole point of having accounts: the
 * register and the exposure chart lead with what reaches you.
 */
export interface Watchlist {
  /** Entity ids as used by the exposure chart, e.g. a company or sector id. */
  entityIds: string[];
  /** Whole categories of disruption, for readers who follow a beat not a name. */
  categories: DisruptionCategory[];
}

export interface AlertPreferences {
  /** Off until the reader turns it on. Never opt-out by default. */
  enabled: boolean;
  channels: AlertChannel[];
  /** Do not notify below this severity. */
  minimumSeverity: Severity;
  /** Restrict alerts to the watchlist rather than the whole register. */
  onlyWatchlist: boolean;
}

export interface Account {
  id: AccountId;
  /** Held for delivery and for the reader to recognise their own account. */
  email: string;
  /** Optional, and optional on purpose — nobody has to supply a real name. */
  displayName: string | null;
  /** ISO 8601. */
  createdAt: string;
  watchlist: Watchlist;
  alerts: AlertPreferences;
}

/** What is required to create one. Note the absence of anything secret. */
export interface NewAccount {
  id: AccountId;
  email: string;
  displayName?: string | null;
}

/**
 * The storage contract.
 *
 * Deliberately small. Every method is something the product actually needs, and
 * nothing here reads or writes a credential. A real implementation talks to a
 * database in a separate service; this interface is what the site would call.
 */
export interface AccountRepository {
  findById(id: AccountId): Promise<Account | null>;
  /** Emails are matched case-insensitively; implementations must normalise. */
  findByEmail(email: string): Promise<Account | null>;
  create(input: NewAccount): Promise<Account>;
  updateWatchlist(id: AccountId, watchlist: Watchlist): Promise<Account | null>;
  updatePreferences(id: AccountId, preferences: AlertPreferences): Promise<Account | null>;
  /** Must actually remove the record, not flag it. Returns false if unknown. */
  deleteAccount(id: AccountId): Promise<boolean>;
}

/** A new account follows nothing and is notified about nothing until it opts in. */
export const EMPTY_WATCHLIST: Watchlist = { entityIds: [], categories: [] };

export const DEFAULT_ALERT_PREFERENCES: AlertPreferences = {
  enabled: false,
  channels: [],
  minimumSeverity: 'moderate',
  onlyWatchlist: true,
};

/**
 * Emails are stored lower-cased and trimmed so that lookup is stable and one
 * person cannot end up with two accounts by capitalising differently.
 */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * A deliberately permissive shape check, not an attempt to validate that an
 * address exists. The only way to know an address is real is to send to it,
 * and over-strict patterns reject valid addresses.
 */
export function looksLikeEmail(email: string): boolean {
  const value = normaliseEmail(email);
  return value.length <= 254 && /^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(value);
}
