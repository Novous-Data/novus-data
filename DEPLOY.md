# DEPLOY.md — Novus Data

Two separate tasks, in order. **Do the first one now. Do not do the second one
until you have decided to move the domain deliberately.**

Nothing in here is done by an agent: every step needs an account you own.

---

## Before you start: fill in what the build requires

A production build **will fail on purpose** until three things exist. That is by
design — the alternative is shipping an about page with no author and a subscribe
button that goes nowhere.

1. **`src/config/publication.ts` → `authors[0].name`** — the editor's name
   exactly as it should appear in print. `authors` is an array in masthead
   order and the **first entry is the editor**: the byline of record, and the
   name the build refuses to run without. Its `id` is `'editor'` and should
   stay that way — register entries point at these ids, and changing one
   silently detaches every assessment that person made.
2. **`NEXT_PUBLIC_BEEHIIV_SUBSCRIBE_URL`** — your Beehiiv subscribe page.
3. **`NEXT_PUBLIC_CONTACT_EMAIL`** — the address you are happy to publish.

While you are in `publication.ts`, also fill in that entry's `credentials` —
statements that are **true and checkable today**, nothing forthcoming. An empty
list is fine and the page renders correctly without it.

**Adding a second author** means appending another entry to `authors` with its
own permanent `id`. Do that *before* the first co-written register entry, not
after: retro-fitting attribution to files that never carried it means guessing
who wrote what.

Check locally before pushing:

```bash
npm run typecheck && npm run lint && npm run build
```

If the build fails, read the error: it names every missing input and where to put
it.

---

## Part 1 — First deployment

### 1. Push the repository to GitHub

```bash
git push -u origin <your-branch>
```

The repository can be private. Vercel reads it through the GitHub integration.

### 2. Create the Vercel account

Go to [vercel.com](https://vercel.com) and **sign up with GitHub**. Signing up
with GitHub is what makes your repositories appear automatically; signing up with
email means connecting them by hand afterwards.

Choose the **Hobby** plan. Note: Hobby is non-commercial use only. A free
newsletter with no transactions is fine. If Novus Data ever takes paid
subscriptions or runs ads, that needs a Pro plan.

### 3. Import the project

1. **Add New… → Project**.
2. Pick the `novus-data` repository.
3. Confirm **Framework Preset: Next.js**. It should be detected. If it says
   anything else, stop — something is wrong with the import.
4. Leave Build Command, Output Directory and Install Command on their defaults.
5. Under **Node.js Version**, confirm it matches `.nvmrc` (**22.x**). If 22 is not
   offered, 20.x is acceptable.

### 4. Set environment variables

In the import screen, expand **Environment Variables** and add these. Apply each
to **Production, Preview and Development** unless noted.

| Key | Value | Required |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Leave **unset** for now | No |
| `NEXT_PUBLIC_BEEHIIV_SUBSCRIBE_URL` | Your Beehiiv subscribe page URL | **Yes** |
| `NEXT_PUBLIC_CONTACT_EMAIL` | The address you publish | **Yes** |
| `NEXT_PUBLIC_BEEHIIV_HOME_URL` | Your Beehiiv publication homepage | Optional |
| `NEXT_PUBLIC_BEEHIIV_FEED_URL` | Your Beehiiv RSS feed URL | Optional |
| `CONTENT_SOURCE` | `local` | Optional (this is the default) |

**Do not set these on Vercel:**

- `BEEHIIV_RSS_URL` — read only by the sync script on your own machine.
- `NOVUS_ALLOW_INCOMPLETE` — setting it defeats the build guard.
- `NOVUS_CONTENT_DIR` — review tooling only.

Leaving `NEXT_PUBLIC_SITE_URL` unset is deliberate: the site falls back to
`https://$VERCEL_URL`, so canonical URLs and social cards are correct on the
`.vercel.app` domain without you having to know it in advance. Set it when you
move to a real domain, in Part 2.

### 5. Deploy

Press **Deploy** and wait. Vercel gives you a URL ending in `.vercel.app`.

**If the build fails, send me the full Vercel log.** Do not guess at it — the log
names the cause, and the most likely one is a missing environment variable, which
the error states explicitly.

### 6. Verify the deployment

Open each of these and check what it should show.

| Open | It is right if… |
|---|---|
| `/` | Before any issues: the pre-launch state — what Novus Data is, what it covers, a subscribe block. After the first issue: that issue's real title and date at the top |
| `/briefings` | Before any issues: a plain statement that nothing has been published. After: every issue, newest first |
| `/coverage` | Seven topics, each with why it matters and what is reported |
| `/about` | Your name, and only claims you can support |
| `/subscribe` | The button goes to **your** Beehiiv page |
| `/contact` | Your email address, as a working `mailto:` link |
| `/privacy` | Reads accurately — **you are responsible for this page** |
| `/nonexistent-page` | The branded 404, not a Vercel error page |
| `/debug/content` | **404.** It is development-only. If it renders, stop and tell me |
| `/sitemap.xml` | Every public route, with absolute URLs on the right domain |
| `/robots.txt` | Allows everything, disallows `/debug/`, names the sitemap |

Then, **on your phone**:

- The header shows a **Menu** button; tapping it opens the navigation and tapping
  a link closes it.
- Nothing scrolls sideways on any page.
- Text is comfortably readable without zooming.

Finally, paste the deployment URL into a Slack or iMessage draft (do not send it)
and confirm the **link preview** shows the Novus Data card rather than a blank
box. If it is blank, wait a minute and try again — the image is generated on
first request.

---

## Part 2 — Domain cutover (a separate, deliberate task — not today)

Only do this when the new site is genuinely better than what Beehiiv currently
serves on the same domain.

### Go / no-go checklist

Do not cut over until **all** of these are true.

- [ ] At least one real issue is published and renders correctly on the new site.
- [ ] `/about` states your real name and only verifiable facts.
- [ ] `/privacy` has been read line by line **by you** and is accurate.
- [ ] The subscribe button reaches your Beehiiv page and a test subscription works.
- [ ] The site looks right on your own phone, not just in a simulator.
- [ ] You have a free hour. Not late at night.

### Steps

1. **Vercel → Project → Settings → Domains → Add.** Enter the domain. Vercel
   displays the DNS records it needs.
2. **At your registrar**, add exactly those records. Change nothing else.
3. **Remove or repoint the Beehiiv custom domain.** Two services must not claim
   the same hostname. This is the step people forget, and it is what produces a
   redirect loop.
4. **Wait for propagation.** Usually minutes, occasionally hours. Vercel's Domains
   page shows the status.
5. **Verify:** `https://` works, the certificate is valid, `www` and the apex both
   resolve the way you intend, and there is no redirect loop. Check in a private
   window so you are not seeing a cached redirect.
6. **Set `NEXT_PUBLIC_SITE_URL`** in Vercel to the real origin, with no trailing
   slash, and **redeploy**. Until you do, canonical URLs, the sitemap and social
   card URLs still point at the `.vercel.app` domain.
7. Re-run the Part 1 verification table against the real domain.

**This is reversible.** Reverting the DNS records puts things back. That is the
reason to do it with hours to spare rather than under pressure.

---

## Part 3 — After each new issue

The first time you publish an issue after the site is live, check that the one
manual step really is the only one.

```bash
npm run sync-issues
# review the new file in content/issues/
git add content/issues/ && git commit -m "content: add issue N"
git push
```

Then confirm, with **no other edits**:

- [ ] The home page hero shows the new issue.
- [ ] `/briefings` lists it at the top.
- [ ] Its own page renders, with the right date and a sensible reading time.
- [ ] Previous/next navigation on the issue before it now points to the new one.
- [ ] `/sitemap.xml` contains the new URL.
- [ ] Pasting the new issue's URL into a chat draft shows a card with its real
      title.

If any of those needed a hand-edit, that is a bug in the site, not a chore.
Tell me and I will fix it.

---

## Part 4 — Turning on accounts (Supabase)

Optional and separate. The site deploys and runs perfectly well with no account
store: leave `ACCOUNT_STORE` unset and the sign-in panel keeps its pre-launch
behaviour, sending nothing anywhere.

**Do this in order.** Steps 1–3 are yours — they need a Supabase account, and
account access is out of scope for any agent working on this repo (Rule 7).

### 1. Create the project

1. Sign up at supabase.com and create a project. The free tier is enough.
2. Choose a region close to your readers.
3. Save the database password somewhere safe. You will not need it for this
   site, but you cannot see it again.

> **Free projects pause after about a week with no traffic.** Pre-launch, this
> *will* happen to you and the site will report that sign-in failed. Unpausing
> is one click in the dashboard. Don't spend an hour debugging code first.

### 2. Turn on magic links, and turn off passwords

In **Authentication → Providers → Email**:

- Enable **Email**.
- **Disable "Confirm password"** / password sign-in. This site has no password
  field and no reset flow; leaving password auth enabled would create a way in
  that the interface does not support.
- Leave **"Confirm email"** on.

In **Authentication → URL Configuration**:

- **Site URL**: your deployed origin, e.g. `https://novusdata.com`.
- **Redirect URLs**: add `https://<your-domain>/auth/callback` and, for local
  work, `http://localhost:3000/auth/callback`.

A magic link that redirects anywhere not on that list is rejected. That is the
protection against somebody crafting a link that signs a reader in and bounces
them to another site.

### 3. Create the schema

**SQL Editor → New query**, paste all of this, run it once.

```sql
-- Preferences attached to an identity. auth.users owns the identity itself;
-- nothing here is or contains a credential.
create table public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

create table public.watchlist_entities (
  user_id   uuid not null references auth.users on delete cascade,
  entity_id text not null,
  primary key (user_id, entity_id)
);

create table public.watchlist_categories (
  user_id  uuid not null references auth.users on delete cascade,
  category text not null,
  primary key (user_id, category)
);

create table public.alert_preferences (
  user_id          uuid primary key references auth.users on delete cascade,
  enabled          boolean not null default false,
  channels         text[]  not null default '{}',
  minimum_severity text    not null default 'moderate',
  only_watchlist   boolean not null default true
);

-- ---------------------------------------------------------------------------
-- Row-level security. THIS is what protects the data — not the secrecy of the
-- anon key, which is meant to be public. Without these policies the anon key
-- would read every row in the database.
-- ---------------------------------------------------------------------------
alter table public.profiles             enable row level security;
alter table public.watchlist_entities   enable row level security;
alter table public.watchlist_categories enable row level security;
alter table public.alert_preferences    enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own entities" on public.watchlist_entities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own categories" on public.watchlist_categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own preferences" on public.alert_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Create the rows at signup. A trigger rather than app code: if the reader
-- closes the tab mid-callback, app code would never run and you would collect
-- auth.users rows with no profile.
--
-- Keep this function TRIVIAL. If it throws, signup fails completely and nobody
-- can create an account — which is why both inserts swallow conflicts.
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  insert into public.alert_preferences (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

`security definer set search_path = ''` is the documented hardening — without
it, a `security definer` function can be hijacked by manipulating the search
path.

### 4. Set the environment variables

From **Project Settings → API**. Locally, into `.env.local` (git-ignored, never
committed). On Vercel, into **Settings → Environment Variables**.

| Key | Where to find it | Exposure |
|---|---|---|
| `ACCOUNT_STORE` | type `supabase` | — |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key | **Public by design** |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | **Secret. Server only.** |

> **The one that can destroy this project.** `SUPABASE_SERVICE_ROLE_KEY`
> bypasses every policy you just wrote. If it ever acquires a `NEXT_PUBLIC_`
> prefix it is inlined into the browser bundle and every reader's data is
> public. The code throws at startup if it sees `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`,
> but that guard is a backstop, not permission to be careless. On Vercel, set it
> for Production and Preview only — and if you ever suspect it leaked, rotate it
> in the dashboard immediately and assume the old one is compromised.

### 5. Check it works

```
npm run build && npm run start
```

Then, in a browser:

1. Home page → enter your address → "Email me a link".
2. Open the email, click the link. You should land on `/account`.
3. Tick a category, save, reload — it should persist.
4. Sign out. `/account` should now redirect you away.
5. Sign back in, type `DELETE`, delete the account. Confirm in the Supabase
   dashboard (**Authentication → Users**) that the row is gone, and that
   `profiles` no longer holds it either — that is `on delete cascade` working.

Do step 5 at least once before launch. Deletion is the hardest thing to test
after you have real readers, and the easiest to get quietly wrong.

### 6. Roll back

Unset `ACCOUNT_STORE` and redeploy. The site returns to its pre-launch state
with no accounts, no cookie and no database calls. Nothing else has to change,
which is the point of keeping the reading site static.
