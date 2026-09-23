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

## Part 5 — Live data and the AISStream key

`/monitor` reads nine feeds and regenerates every fifteen minutes. **Seven need
nothing from you**: GDELT, USGS, GDACS, NOAA NHC, NASA EONET, Open-Meteo and
FRED work the moment the site is deployed. Vessel counts at ten chokepoints
need a free AISStream key (this part); share prices need a licensed key and a
decision (Part 6). Without it, that one panel says "not
switched on yet" and everything else still works, so this is not a launch
blocker.

Steps 1–3 need an AISStream account and the Vercel dashboard, which are yours
(Rule 7).

### 1. Get the key

1. Go to <https://aisstream.io> and sign in. (At the time of writing it offers
   sign-in with a GitHub account; no payment details are asked for.)
2. Open the **API Keys** page and create a key.
3. Copy it. Treat it like a password: don't paste it into a chat, an email, a
   screenshot or a commit. **If a key has already been pasted into a chat or a
   shared conversation, delete it on the same page and create a fresh one** —
   it costs nothing, and the old one can no longer be assumed private.

### 2. Try it locally first

In `.env.local` (git-ignored — never `.env.example`):

```
AISSTREAM_API_KEY=paste-the-key-here
```

Then:

```
npm run live:check
```

It reads every feed once, for real, and takes about 35 seconds. The AISStream
section should report how many of the ten chokepoint boxes heard vessels. The
other six sections should each say **Live** with a count. It never prints the
key. If a feed reports a parse failure rather than an HTTP status, the
publisher's response shape differs from what the adapter expects — note which
one and it can be fixed in `src/lib/live/sources/`.

> **The name is exactly `AISSTREAM_API_KEY`, with no `NEXT_PUBLIC_` prefix.**
> That prefix would publish the key in every visitor's browser. The build
> refuses to run if it sees `NEXT_PUBLIC_AISSTREAM_API_KEY`; if that ever
> happens, rename it *and* create a new key at aisstream.io, because the old
> one must be assumed public.

### 3. Add it to Vercel

1. Vercel → your project → **Settings → Environment Variables**.
2. Key `AISSTREAM_API_KEY`, value the key. Tick **Production** (and **Preview**
   if you want preview deployments to sample vessels too).
3. **Redeploy.** Environment variables reach a deployment only when it is
   built, so the running site will not see the key until you do.

### 4. Check it works

1. Open `/monitor`. Under **Feed status**, "Vessels heard at ten chokepoints"
   should show a time and **Live**, not "Not switched on yet".
2. `/live.json` should show `"ais": { "status": "ok", ... }`.
3. Wait fifteen minutes and reload: the times should move. The page
   regenerates on the first visit after each fifteen-minute window, so on a
   quiet site the first visitor after a gap briefly sees the older copy.

### Costs and limits worth knowing

- **Open-Meteo is free for non-commercial use only.** The day the site takes
  payment or runs ads, the weather panel needs Open-Meteo's paid plan, or
  it has to be removed. Nothing else changes when that happens.
- **Regeneration uses function time.** Each regeneration runs for about 35
  seconds (the vessel sample is 30), at most once per fifteen minutes and only
  when someone visits. That is well inside Vercel's Hobby allowance. The
  route's `maxDuration` is 60 seconds.
- **GDELT occasionally rate-limits.** Vercel's outbound addresses are shared
  with other customers, so a theme can come back rate-limited through no fault
  of this site. It shows as unavailable for one cycle, and the others still
  render.

### 5. Optional — let the automatic check test it too

The `live-check` workflow reads every feed for real on each PR that touches the
live layer. To include the vessel sample: GitHub → the repository → **Settings
→ Secrets and variables → Actions → New repository secret**, name
`AISSTREAM_API_KEY`, the same value. The workflow prints only whether the key
is set, and GitHub masks secrets in logs.

### Roll back

Delete `AISSTREAM_API_KEY` in Vercel and redeploy. The vessel panel returns to
"not switched on yet"; nothing else changes.

## Part 6 — Share prices (a licensing decision first)

Energy prices need nothing: they are public-domain U.S. government data. **Share
prices are different.** Exchange prices are licensed, and every free API tier
checked when this was built — Finnhub's included — is for personal,
non-commercial use. A public website showing prices is redistribution. So the
share-price panel is built, tested, and **off**.

Your options, in order of honesty:

1. **Leave it off.** The monitor is complete without it; energy prices and the
   dollar are already there.
2. **Buy a plan that licenses display**, or get Finnhub's written permission,
   then switch it on as below.
3. Switch it on with a free key anyway. Don't — it breaches the provider's
   terms on a site whose whole claim is that it does things properly.

To switch it on once licensed:

1. Create a key in the Finnhub dashboard.
2. Vercel → **Settings → Environment Variables** → `FINNHUB_API_KEY` (no
   `NEXT_PUBLIC_` prefix — the build refuses one) → Production → **Redeploy**.
3. `/monitor` → **Energy and markets → Share prices** should list five funds,
   plus the ticker of every company on the exposure chart.

Which funds are quoted is `src/config/markets.ts`. It lists funds rather than
companies on purpose — see the comment there.

---

## Part 7 — Move the repository into a free organisation

**Done 23 September 2026.** The organisation exists and the repository now
lives at **`github.com/novus-data/novus-data`**; the steps below are kept as
the record of how, and step 5 is the checklist for anything that still points
at the old `Novous-Data/novus-data` address. `Novous-Data` remains the
editor's personal login; it is no longer where the repository lives.

**Why.** The repository belongs to a personal account (`Novous-Data`), and
GitHub gives a personal account's collaborators one fixed level — *write* —
with no way to make anyone else an admin. Settings, secrets, branch rulesets,
collaborators and deletion all stay with that one login. An organisation has
real roles, so both of us can be owners. GitHub Free for organisations costs
nothing, and for a public repository it includes everything this project uses:
Actions, secrets and rulesets.

Every step needs your GitHub login (Rule 7). Signed in as `Novous-Data`:

### 1. Turn on two-factor authentication — both of you, first

github.com → avatar → **Settings → Password and authentication → Enable
two-factor authentication**. An owner can delete everything, so the two logins
become the only lock on the project. Alex does the same on `arowsom-oss`.

### 2. Create the organisation

Avatar → **Your organizations → New organization → Free**.

- **Name.** GitHub says as you type whether a name is free. Try `novus-data`
  first: the current account is spelled *Novous*, and this is the moment to
  fix it. The name becomes the address — `github.com/<name>/novus-data`.
- **Contact email.** Any address you read.
- **"This organization belongs to"** → **My personal account.** The other
  option, *A business or institution*, accepts GitHub's Corporate Terms on a
  business's behalf. Choose it only once Novus Data is a registered legal
  entity; you can switch later.
- When asked to add members, add **`arowsom-oss`**. Alex receives an
  invitation and must accept it.

### 3. Make Alex an owner

Organisation → **People** → `arowsom-oss` → **Change role → Owner**. You are
already an owner as the creator.

**What owner means.** Either of you can change anything, including deleting
the repository, deleting the organisation, and removing the other owner.
That is what full access is, and it is the normal setup for two co-founders —
GitHub also recommends at least two owners so an organisation is never lost
with one account. Agree between you, in writing, that neither removes the
other or deletes anything without asking first.

### 4. Transfer the repository

`github.com/Novous-Data/novus-data` → **Settings → General → Danger Zone →
Transfer** → **Specific organization** → pick the new one → type the
repository name to confirm.

Code, branches, issues and pull requests — open ones included — move with it.
GitHub redirects the old address, both in the browser and for `git`.

### 5. Reconnect what pointed at the old address

- **Claude Code on the web.** Its access was granted to the `Novous-Data`
  account, not to the new organisation. Reconnect at claude.ai → **Settings →
  Connectors → GitHub**, and when GitHub asks where to install, include the
  new organisation and this repository. Until then, Claude sessions cannot
  read or push to it.
- **Vercel**, if the project is already imported: **Project → Settings → Git**.
  If it shows disconnected, reconnect and allow the Vercel app on the
  organisation.
- **Local clones:** `git remote set-url origin
  https://github.com/<name>/novus-data.git`. The redirect works today, but it
  breaks for good if anyone ever creates a new `Novous-Data/novus-data`.

Nothing in the code needs changing: no file in the repository contains its own
address.

### 6. Then make the workflow rule real

With both of you owners, either can create the default-branch ruleset in
CONTRIBUTING.md ("Make the first rule real"). It is the reason admin access
was worth having.
