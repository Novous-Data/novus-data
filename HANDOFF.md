# HANDOFF.md — Novus Data website

State of the build, what is unresolved, and what I decided when the brief did not
decide for me. Written to be read once, in order.

---

## 1. Read these three things first

1. **Nothing on this site states a fact you did not supply.** Section 0 of the
   brief arrived entirely unfilled, so rather than inventing a bio, a subscriber
   count or a publishing schedule, every fact is centralised in
   `src/config/publication.ts` with a ledger recording where it came from. Facts
   never supplied are `null` and the site renders around their absence. Start at
   `INPUT_LEDGER` in that file — it is the to-do list. (Section 3 below.)

2. **A production build fails on purpose right now.** Three inputs are
   launch-critical — your name, the subscribe URL, the contact address — and
   `npm run build` refuses to run while any is missing, naming exactly what to
   fill in. That is deliberate: an about page with no author defeats the point of
   the site. (Section 4.)

3. **`/privacy` is yours to check.** It describes how the site actually behaves
   and is deliberately not drafted as a legal policy. Read it line by line before
   the domain goes live. `src/app/privacy/page.tsx:16` carries the TODO.
   (Section 8.)

---

## 2. What was built

All twelve milestones of the brief, plus a review preview that was not in it.

| Milestone | State |
|---|---|
| 0 Preflight and design plan | Done. Directory was not empty — see 4.3 |
| 1 Scaffold, docs, env | Done |
| 2 Design tokens, fonts, wordmark, icons | Done |
| 3 Content layer, `/debug/content` | Done |
| 4 Sync script | Written and tested; **never run against the real feed** — no URL supplied |
| 5 Site shell, 404, error boundaries | Done |
| 6 Deployment instructions | `DEPLOY.md`. Not executed — Rule 7 |
| 7 Home page, including pre-launch state | Done |
| 8 Archive and issue pages | Done |
| 9 Editorial and information pages | Done |
| 10 Metadata, OG images, sitemap, robots, JSON-LD, headers | Done |
| 11 Accessibility, performance, responsive | Done and measured — see 7 |
| 12 README and handoff | This file, plus `README.md`, `CLAUDE.md`, `DEPLOY.md` |

**Versions installed:** Next.js **16.3.4**, React **19.2.8**, React DOM 19.2.8,
Tailwind CSS **4.3.3**, TypeScript 5.9.3, Node 22.22.2 (`.nvmrc` pins 22).

`create-next-app` pinned `next@16.3.5`, which the npm registry does not serve —
`latest` is 16.3.4. Corrected to 16.3.4 before installing.

---

## 3. Every unresolved input

These are the questions I could not answer for you. They are also encoded in
`INPUT_LEDGER` (`src/config/input-ledger.ts:43`), which drives `/debug/content`
and the review preview's panel, so this list cannot silently go stale.

### Blocks a production build

| Input | Where | What I need |
|---|---|---|
| Author name | `src/config/publication.ts:107` (`author.name`) | Your name exactly as it should appear in print |
| Subscribe URL | `NEXT_PUBLIC_BEEHIIV_SUBSCRIBE_URL` | Your Beehiiv subscribe page |
| Contact email | `NEXT_PUBLIC_CONTACT_EMAIL` | The address you are content to publish |

### Drafted by me — confirm or rewrite

| Input | Where | Note |
|---|---|---|
| One-sentence description | `publication.ts` → `description` | Appears in search results and on every shared link |
| Short description | `publication.ts` → `shortDescription` | Footer only |
| Positioning paragraph | `publication.ts` → `positioning` | Rewrite if it does not sound like you |
| Primary and secondary readers | `publication.ts` → `primaryReader`, `secondaryReaders` | `/coverage` explains every topic to these readers specifically, so changing them changes that page |
| Methodology | `publication.ts` → `methodology` | **Three paragraphs claiming how the work is done. Read them line by line — if any is not true yet, cut it** |
| The seven tracked topics | `src/config/coverage.ts` | Drafted from your description of the project. Cut, reorder or rewrite freely |

### Never supplied — the site omits the claim entirely

| Input | Consequence today |
|---|---|
| Author bio facts (`author.credentials`) | `/about` states nothing about you beyond your name |
| Publishing cadence (`cadence`) | Subscribe blocks say "Delivered by email. Free." and claim **no schedule**. Set it only once you are actually keeping one |
| First issue date (`firstIssueDate`) | The pre-launch hero announces no date |
| `NEXT_PUBLIC_BEEHIIV_HOME_URL`, `NEXT_PUBLIC_BEEHIIV_FEED_URL` | Those footer links do not render |
| `NEXT_PUBLIC_SITE_URL` | Falls back to `$VERCEL_URL`, then localhost. Set it at domain cutover |
| `BEEHIIV_RSS_URL` | **The archive is empty and the feed was never inspected.** See 6 |
| Logo file | Wordmark and icons are set typographically. See 4.4 |
| Three visual reference sites | Design follows the brand spec and the editorial references named in the brief |

### One decision I did not make for you

**Author age and student status.** The brief's default is not to mention age,
school, grade or student status anywhere, and Section 0 was blank, so
`discloseStudentStatus` is `false` and nothing on the site mentions or implies it.
The brief is explicit that this is your strategic decision, not mine. Flag it if
you want it changed; I have not routed around it.

---

## 4. Judgement calls I had to make

Ordered roughly by how much they would cost to reverse.

### 4.1 I built the site rather than stopping at the unfilled Section 0

The brief says to stop and ask when a Section 0 placeholder is unfilled. Every one
of them was. You asked for the site to be built so you could review it here, so I
built everything that does not depend on those answers — which turned out to be
the whole site — and routed every fact through one config file with `null` for
anything unsupplied. Nothing is invented, and filling the blanks is now an edit to
one file rather than a rebuild.

**Reversible:** trivially. Every unfilled value is one line.

### 4.2 A production build refuses to run with launch-critical facts missing

`assertLaunchReady()` in `src/config/input-ledger.ts:189` throws during a
production build when the author name, subscribe URL or contact address is
missing. `NOVUS_ALLOW_INCOMPLETE=1` bypasses it for review builds and is never set
on Vercel.

The ledger and the guard live in their own module, separate from
`publication.ts`, because **only server code may import them** — see 5.4.
`publication.ts` itself is pure data with no side effects, so it is safe to
import anywhere.

I chose a loud failure over a quiet placeholder because the failure mode it
prevents — publishing an about page with no author — is exactly the thing the
site exists to avoid.

### 4.3 The repository was not empty, and I did not move what was there

`experiments/castrum-maris/` (an unrelated HTML experiment, 160 KB) was already
in the repository. The brief says to stop if the directory contains files. I
scaffolded **alongside** it rather than over it: nothing in `experiments/` was
read, moved or modified, and it is excluded from linting. Next.js and Vercel both
ignore it. Delete it or move it whenever you like; nothing depends on it.

### 4.4 No logo file, so the wordmark is typographic

The brand palette is described in the brief as derived from an existing Novus Data
logo, but the file was not supplied. The brief forbids redrawing or approximating
it, so I did neither. The wordmark is set in Source Serif 4 (`src/components/wordmark.tsx`)
and `icon.tsx` / `apple-icon.tsx` generate the icons from the same treatment.

**When you supply the real logo:** replace `wordmark.tsx`, and replace the two
icon routes with the file. That is the whole change.

### 4.5 Source Serif 4 TTFs are committed to the repository

`src/assets/fonts/` holds two 53 KB TTFs. The image generator behind the icons and
social cards needs TTF or WOFF, and `next/font` serves WOFF2, so the font data has
to come from somewhere. Committing it also means social card generation does not
depend on a third-party request succeeding mid-build. Source Serif 4 is SIL Open
Font License, so redistribution inside the repository is permitted.

### 4.6 Cover images bypass `next/image`

`src/app/briefings/[slug]/page.tsx:215` disables `@next/next/no-img-element` **for
that one component**, with the reason in a comment. Routing newsletter CDN images
through `next/image` would require a `remotePatterns` allowlist that fails
silently the day Beehiiv changes CDN host. The rule is not disabled anywhere else.

### 4.7 The site has one client component, and it is the navigation, not just the menu toggle

The brief expected the mobile menu toggle to be the only client component. I made
the whole of `SiteNav` a client component instead, because `aria-current` on the
active navigation item needs the pathname, which a server component cannot read.
The cost is a few hundred bytes; the gain is that screen readers announce which
section you are in. Everything else on the site renders on the server.

### 4.8 The archive left-column number is padded, the prose number is not

`0007` in the archive column, where the padding is what makes the numbers form a
true column; plain `Issue 7` anywhere it is read as a sentence. Two formatters,
`formatIssueNumber` and `formatIssueLabel` (`src/lib/format.ts`).

### 4.9 The reading column is 52rem so that the 66ch cap is what actually binds

At the obvious 44rem the container bound first and body copy measured ~56
characters, short of the 66–72 the brand spec calls for. Measured after the
change: **749px ≈ 66 characters at 18px**.

### 4.10 `NOVUS_CONTENT_DIR` exists, and only review tooling uses it

`src/lib/content/sources/local-files.ts:29` lets the archive directory be
overridden. It exists so the review preview can build a second copy of the site
against a throwaway archive of `[SAMPLE]` issues without ever writing them into
the repository. It is not used by `dev`, `build` or any deployment, and it must
not be set on Vercel.

### 4.11 The review preview is built from the real build output

Not in the brief; built because you asked to review the site before publishing it.
`scripts/build-preview.ts` runs the real production build twice — once against the
real (empty) archive, once against sample issues — and folds the prerendered pages
into one HTML file with each page rendered in an iframe so the site's own media
queries respond to the frame width. Because the pages come from the actual build,
**the preview cannot drift from the site**; there is no second implementation of
any layout or any line of copy.

---

## 5. Bugs found and fixed during review

Recorded because two of them are the kind that come back.

### 5.1 Issue bodies were rendering almost invisibly

`@tailwindcss/typography` registers `.prose` in Tailwind 4's **utilities** layer.
My `.prose-novus` overrides were in `@layer components`, which the cascade
resolves **first** — so every override lost, and issue bodies rendered at the
plugin's default gray-700 on the navy background. Measured before the fix:
`rgb(55,65,81)` on `#070C20`, about 1.5:1.

Fixed by making the `.prose-novus` rules **unlayered**, which beats a layered
utility. Measured after: `rgb(244,246,250)`, ~17:1, 18px body, 66ch measure.

**This will come back if someone tidies those rules into a layer.** The reason is
commented in `globals.css` and repeated in `CLAUDE.md`.

### 5.2 Outbound links in synced issues lost their `rel` hardening

`sanitize-html` applies `allowedAttributes` **after** `transformTags`, so the
`rel="noopener noreferrer"` and `target="_blank"` the transform added were
stripped again. Fixed by permitting both attributes on `a` as well as setting
them. Verified in the generated file.

### 5.3 Page titles did not share a left edge with their body text

`PageHeader` used the 68rem container while `/about`, `/coverage`, `/subscribe`,
`/contact` and `/privacy` put their body in the 52rem reading container, leaving
the `h1` and the prose on two different left edges. `PageHeader` now takes a
`width` that must match the page body.

### 5.4 The launch guard was running in the browser and crashing the page

Found by the audit, in the last review pass, and the worst of the four.

The readiness check lived at the bottom of `publication.ts` and ran on module
load. When the mobile menu was restructured, the wordmark came with it into the
site's one client component — which pulled `publication.ts`, and therefore the
assertion, into the browser bundle. `NOVUS_ALLOW_INCOMPLETE` is not a
`NEXT_PUBLIC_` variable, so it is not inlined for the browser: in the client the
guard saw a production build with the author name missing and **threw during
hydration**, dropping every page into the global error boundary. Lighthouse
showed it as accessibility 83 with no `<title>`, no `<main>` and no landmarks.

Fixed by splitting the module. `src/config/publication.ts` is now pure data,
safe to import anywhere. `src/config/input-ledger.ts` holds the ledger and the
guard, is imported for its side effect by the root layout alone, and additionally
returns early when `typeof window !== 'undefined'`.

**The general lesson, worth keeping:** a config module that throws on import is a
hazard, because you cannot see from the import site that it has a side effect. If
another build-time assertion is ever needed, put it in a module whose name says
so and keep it out of the client tree.

### 5.5 Tap targets below 44px

Footer navigation (19px), header navigation (41px), the 404 link list (20px), the
`/coverage` contents list and the previous/next issue links (30px) were all under
the brief's 44×44 floor. All now `min-h-11`. Inline links inside prose are left
alone, which is the correct exemption.

### 5.6 The open mobile menu overlaid the headline mid-word

The menu was absolutely positioned and floated over the page, so opening it on
the home page clipped the hero title through the middle of a word — correct
overlay behaviour that nonetheless reads as a rendering fault. The header is not
sticky, so there was nothing to gain from floating it: the panel is now in the
document flow and pushes the page down, which also removed the absolute
positioning and the z-index.

---

## 6. Feed findings — not yet established

The brief asks for four answers about the Beehiiv feed before Milestone 4. No
`BEEHIIV_RSS_URL` was supplied, so **none of them could be answered**, and the
archive is empty as a result.

1. How many `<item>` elements the feed returns — **unknown**.
2. Whether `content:encoded` carries full post HTML or only a summary — **unknown**.
3. The exact format of `<link>` values — **unknown**.
4. Whether `<enclosure>` or `media:content` supplies a cover image — **unknown**.

**This matters more than it looks.** Whatever the sync script writes into
`content/issues/` is what the repository owns permanently. If the feed carries
summaries only, the archive captures summaries only, and the issue pages will
have no body. The script warns per item when a body is missing, so the first real
run answers question 2 immediately.

**A Beehiiv feed exposes only a window of recent items — commonly about twenty.**
Any issue already published is recoverable only while it is still in that window.
If issues exist, run the sync soon.

The script was verified end to end against a local server serving a Beehiiv-shaped
feed — CDATA titles, `content:encoded` bodies, `enclosure` and `media:content`
images, categories, and a deliberately summary-only item. Confirmed: first run
writes; second run skips everything and writes nothing; `--force <slug>` rewrites
exactly one file and keeps its original filename so archive ordering does not
shift; `--dry-run` writes nothing; a fetch failure and an unset URL each print a
readable message and exit non-zero; `<script>`, `<style>`, `<iframe>`, inline
styles, event handlers and `javascript:` URLs are all stripped.

---

## 7. Measured results

Run against a production build served by `next start`, with three sample issues in
the archive. **These are measured numbers, not estimates.**

### Lighthouse

| Page | Form factor | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|---|
| `/` | Mobile | **96** | **100** | **100** | **100** |
| `/` | Desktop | **100** | **100** | **100** | **100** |
| `/briefings/<issue>` | Mobile | **96** | **100** | **100** | **100** |
| `/briefings/<issue>` | Desktop | **100** | **100** | **100** | **100** |

No failed audits in accessibility, best practices or SEO on either page.

### Accessibility and layout audit

Across `/`, `/briefings`, an issue page, `/coverage`, `/about`, `/subscribe`,
`/contact`, `/privacy` and the 404, at 320px, 390px, 1440px and 2560px:

- **Contrast:** zero failures. Every text colour meets or beats its threshold
  against `#070C20`.
- **Structure:** exactly one `<h1>` per page; `header`, `nav`, `main` and `footer`
  present on every page; every image has an `alt`.
- **Keyboard:** the skip link is the first tab stop, with a visible 2px focus ring
  in `#7B92BE`. Tab order is wordmark → navigation → main content.
- **Tap targets:** no standalone control under 44px.
- **Overflow:** no horizontal scrolling at any of the four widths.
- **Hydration:** no React warnings or console errors on any route.
- **Mobile menu:** opens and closes, `aria-expanded` tracks it, the label changes
  to "Close", Escape closes it, navigating closes it and sets `aria-current`.
- **Reduced motion:** transition durations collapse to ~0 under
  `prefers-reduced-motion: reduce`.
- **Wide tables and unbroken strings:** a seven-column table and a 90-character
  unbroken URL scroll or wrap inside their own container at 320px, 390px and
  1440px without the page scrolling sideways.

### Behavioural checks

- `/debug/content` returns **404** in a production build.
- An unknown slug returns **404**, not an empty article shell.
- All five security headers present on every route.
- `CONTENT_SOURCE=fixtures npm run build` **fails loudly**, exit 1.
- Four deliberately malformed issue files — no slug, broken YAML, an invalid date,
  a duplicate slug — each produced a warning naming the file; three were skipped,
  the invalid date was kept with the date omitted, and **the build succeeded**.
- An empty archive builds successfully and renders the pre-launch state.
- `grep` for `we`/`our` in `src/`: zero hits in code (Rule 2).
- `grep` for a hardcoded year in `src/`: zero in rendered output. The only matches
  are comments giving date-format examples and the fenced `[SAMPLE]` fixtures.
- `grep` for `lorem`/`placeholder`/`example.com`/`TODO`: one intentional TODO
  (`src/app/privacy/page.tsx:16`) and the fenced fixtures. Nothing else.

### One honest caveat about offline builds

The brief asks that `npm run build` succeed with no network access at all. With a
warm `.next` cache it does — verified with the proxy pointed at a dead port. With
a **cold** cache it does not, because `next/font/google` downloads the font files
during the build:

```
Failed to fetch Inter from Google Fonts.
Failed to fetch Source Serif 4 from Google Fonts.
```

This is a `next/font/google` characteristic, not a content-layer one: **nothing in
the content path touches the network**, which is what the requirement is really
protecting. Vercel builds always have network, so it changes nothing in practice.
If you ever want genuinely hermetic builds, the fix is to switch both faces to
`next/font/local` with the WOFF2 files committed — about twenty minutes, and it
diverges from the brief's instruction to load them via `next/font/google`, which
is why I did not do it unasked.

---

## 8. Placeholders and TODOs in the codebase

The complete list. There is nothing else.

| File and line | What it is |
|---|---|
| `src/app/privacy/page.tsx:16` | **The one intentional TODO.** `/privacy` must be reviewed by you before the domain goes live. It describes real behaviour and is explicitly not a legal policy |
| `src/config/publication.ts:107` | `author.name` is `null` and blocks a production build |
| `src/config/publication.ts:109` | `author.credentials` is empty |
| `src/config/publication.ts:93` | `cadence` is `null`; the site claims no schedule |
| `src/config/publication.ts:96` | `firstIssueDate` is `null` |
| `src/lib/content/sources/fixtures.ts` | The only fabricated content in the repository. Every title is prefixed `[SAMPLE]`, it needs `CONTENT_SOURCE=fixtures`, and it throws if a production build touches it |
| `src/components/wordmark.tsx` | Typographic stand-in until the real logo arrives |
| `next.config.ts` → `redirects()` | Empty by design. Add an entry only if a published slug ever has to change |

---

## 9. Deliberately deferred, with reasons

| Item | Why not now |
|---|---|
| **Content Security Policy** | A CSP that accommodates newsletter CDN images needs testing against real traffic on a real domain. A slightly wrong CSP breaks the site silently, which is worse than not having one. Do it after cutover, in report-only mode first |
| **Analytics** | Excluded on purpose. Adding it changes what `/privacy` has to say, and that page currently says the site collects nothing — which is true. Vercel Analytics is the natural Phase 2 choice; it is not installed |
| **A test framework** | Excluded per the brief. `/debug/content` covers the one place a bug is actually likely — a malformed issue file — at zero dependency cost, and that behaviour is verified above |
| **Scheduled sync** | A GitHub Action could run `sync-issues` on a cron. Not built: the manual step is one command, and a silent automated sync writing a bad file into the archive of record is a worse failure than remembering to type it |
| **The site's own RSS feed** | Beehiiv is the source of truth today, so the footer links its feed. **Once Beehiiv is no longer the source of truth, this site should emit its own feed** — it already holds the full archive |
| **Beehiiv embedded subscribe form** | `/subscribe` links out rather than embedding. The iframe's styling against a dark background cannot be judged without the real URL. Try it after launch; if it renders badly, the link-out is already correct |
| **Self-hosted fonts** | See the offline caveat in section 7 |

---

## 10. What Phase 2 should tackle first

My view, in order.

**1. Publish issues.** The single highest-value thing is not code. The site's
entire credibility argument is a hero that shows a real, recent, dated briefing
and an archive with a run of them behind it. Three issues make this site look
like a publication; zero make it look like a landing page, however well built.
Nothing in Phase 2 substitutes for that.

**2. Answer section 3 of this document.** Half an hour of filling in one config
file turns a site that cannot deploy into one that can.

**3. Then, and only then, the indicators layer.** When live data arrives it
belongs at `src/lib/indicators/`, mirroring the content layer: its own types, its
own sources, its own public API, its own failure modes. **Do not bolt it onto
`ContentSource`.** Issues and indicators have different shapes, different refresh
characteristics and different ways of going wrong; merging them makes both harder
to change, and the whole reason the content layer is worth its indirection is that
it kept one external dependency from reaching into every page.

A caution on that layer, given what this publication is about: the moment the site
displays a number, it inherits an obligation to be right about it. Every indicator
needs a source, an as-of timestamp, and a visible behaviour for when it is stale —
decided before the first chart is drawn, not after. A dashboard showing last
week's freight rate as though it were today's would undo more credibility than the
whole of this site builds.

**4. Smaller things, in rough order of value:** the site's own RSS feed once
Beehiiv stops being the source of truth; a CSP in report-only mode; search or tag
filtering once the archive is past roughly thirty issues — not before, since
reverse-chronological browsing is better than a search box for a small archive.
