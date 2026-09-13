'use client';

import { useId, useState } from 'react';

/**
 * The account panel on the home page.
 *
 * IMPORTANT — this is a shell, not a login.
 *
 * There is no authentication behind Novus Data yet. This component exists so
 * the sign-in experience can be designed and reviewed before it is wired up.
 * It therefore:
 *
 *   - has no `action` and never issues a network request;
 *   - never holds the password in React state, stores it, or logs it;
 *   - tells the visitor plainly, before and after they submit, that accounts
 *     are not open — so nobody can type a real password believing it is going
 *     somewhere.
 *
 * When real authentication arrives, replace the submit handler and delete the
 * notice. Do not leave a form here that looks like it works and does not.
 */
export function SignInPanel() {
  const emailId = useId();
  const passwordId = useId();
  const noticeId = useId();
  const [attempted, setAttempted] = useState(false);

  return (
    <section
      aria-labelledby={`${emailId}-heading`}
      className="border border-hairline bg-surface p-7 sm:p-8"
    >
      <h2 id={`${emailId}-heading`} className="font-serif text-heading font-semibold text-fg">
        Sign in
      </h2>
      <p className="mt-2 text-meta text-muted">
        Accounts are not open yet. Everything on Novus Data is free to read without one.
      </p>

      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={(event) => {
          // Nothing is submitted anywhere. See the note above.
          event.preventDefault();
          setAttempted(true);
        }}
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor={emailId} className="text-meta text-muted">
            Email
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="off"
            placeholder="you@example.com"
            className="min-h-11 border border-rule bg-ink px-3 py-2 text-[0.9375rem] text-fg placeholder:text-muted/70"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={passwordId} className="text-meta text-muted">
            Password
          </label>
          <input
            id={passwordId}
            name="password"
            type="password"
            // Deliberately off: offering to save a password for a form that
            // does nothing would be misleading.
            autoComplete="off"
            className="min-h-11 border border-rule bg-ink px-3 py-2 text-[0.9375rem] text-fg"
          />
        </div>

        <button
          type="submit"
          aria-describedby={attempted ? noticeId : undefined}
          className="mt-1 inline-flex min-h-11 items-center justify-center border border-accent bg-surface-2 px-5 py-3 text-[0.9375rem] font-medium text-fg transition-colors hover:border-link"
        >
          Sign in
        </button>

        <p
          id={noticeId}
          role="status"
          className="min-h-[1.25rem] text-meta text-muted"
        >
          {attempted
            ? 'Accounts are not open yet, so nothing was sent. Nothing you typed left this page.'
            : ''}
        </p>
      </form>

      <p className="mt-2 border-t border-hairline pt-4 text-meta text-muted">
        When accounts open they will save the companies and lanes you follow, so the register and
        the exposure chart lead with what reaches you.
      </p>
    </section>
  );
}
