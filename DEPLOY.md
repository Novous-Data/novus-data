# DEPLOY.md — Novus Data

Two separate tasks, in order. **Do the first one now. Do not do the second one
until you have decided to move the domain deliberately.**

Nothing in here is done by an agent: every step needs an account you own.

---

## Before you start: fill in what the build requires

A production build **will fail on purpose** until three things exist. That is by
design — the alternative is shipping an about page with no author and a subscribe
button that goes nowhere.

1. **`src/config/publication.ts` → `author.name`** — your name exactly as it
   should appear in print.
2. **`NEXT_PUBLIC_BEEHIIV_SUBSCRIBE_URL`** — your Beehiiv subscribe page.
3. **`NEXT_PUBLIC_CONTACT_EMAIL`** — the address you are happy to publish.

While you are in `publication.ts`, also fill in `author.credentials` — statements
that are **true and checkable today**, nothing forthcoming. An empty list is fine
and the page renders correctly without it.

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
