# CLAUDE.md — Novus Data website

Working notes for anyone (human or agent) picking this repository up. Read this
before changing anything.

## 1. What this project is

The public website for **Novus Data**, a research briefing on global supply
chains, shipping and trade policy. It presents the publication as a credible,
ongoing research product and hosts the permanent archive of every issue.

Beehiiv is where issues are written and emailed. This repository is where they
live afterwards.

## 2. The two standing constraints

These are quoted verbatim from the build brief and shape every decision.

> **The reader may be evaluating the author, not just the content.** A realistic
> visitor is a finance professional forming a judgement about whether this person
> is serious. Apply this test to every line of copy and every design choice:
> *would this embarrass the author if a managing director opened it?* Overstatement,
> hype vocabulary, and unsupported claims fail badly. Understatement passes.

> **Publishing beats polish.** The publication's value comes from issues shipping
> on schedule. The site must create near-zero recurring maintenance burden. If a
> design requires hand-editing a file per issue beyond the single documented sync
> step, the design is wrong — change it.

## 3. Stack and versions

| Thing | Version | Notes |
|---|---|---|
| Next.js | **16.3.4** | App Router. `create-next-app` pinned 16.3.5, which the registry does not serve; corrected to the published latest. |
| React | **19.2.8** | |
| Tailwind CSS | **4.3.3** | **v4 convention: design tokens live in `@theme` inside `src/app/globals.css`. There is no `tailwind.config.ts` and none should be added.** |
| TypeScript | 5.9.3 | strict |
| Node | 22 (`.nvmrc`) | minimum 20 |

Route props use Next 16's generated globals: `PageProps<'/briefings/[slug]'>`
and `LayoutProps<'/'>`. `params` is a **Promise** and must be awaited.

### A second trap: `input-ledger.ts` must not reach the browser

It asserts at module load. If a client component ever imports it — directly, or
by importing something that imports it — the assertion runs during hydration,
throws, and drops every page into the global error boundary. This already
happened once, when the wordmark moved into the navigation client component and
dragged the guard along with it.

`publication.ts` is deliberately free of side effects so that client components
can read the facts. Keep it that way, and keep `input-ledger.ts` imported only by
the root layout and `/debug/content`.

### A Tailwind 4 trap that already bit once

`@tailwindcss/typography` registers `.prose` in Tailwind's **utilities** layer.
Anything in `@layer components` loses to it in the cascade. The `.prose-novus`
overrides in `globals.css` are therefore **deliberately unlayered** — if they are
moved back inside `@layer components`, issue bodies silently render in the
plugin's default gray-700 on navy, which is close to invisible. Do not "tidy"
them into a layer.

## 4. Non-negotiable rules

### Rule 1 — No fabricated data, metrics, or social proof

Never generate, and never leave in the codebase: subscriber or reader counts,
open rates, growth figures, "trusted by" / "as featured in" logos, testimonials
or endorsements (including anonymised ones), named readers or institutions,
indicator values, freight rates, transit counts or anything presented as market
data, animated counters, stat blocks, "X data sources monitored" claims, or fake
issue titles anywhere that could reach production.

If a layout wants a number, use a real one or change the layout. **Empty is
better than invented.**

Sole exception: `src/lib/content/sources/fixtures.ts`, whose every title is
prefixed `[SAMPLE]`, which is unreachable without `CONTENT_SOURCE=fixtures`, and
which throws at module load if a production build tries to use it.

### Rule 2 — No implied organisation

The publication is written by one person. Copy uses first-person singular or the
publication name. Never "we", "our team", "our analysts", "our research desk", or
anything implying staff, an office or an institution that does not exist.

### Rule 3 — No third-party assets

No Unsplash, Picsum, placeholder.com or any external image service. No stock
photography. No copyrighted logos, marks or fonts outside Google Fonts. Visual
interest comes from typography, layout, spacing, and CSS/SVG written here. Icons
are inline SVG.

### Rule 4 — Ask before installing

Only the dependencies listed in section 7 may be installed without asking.

### Rule 5 — Never commit secrets

`.env.local` is git-ignored. `.env.example` is committed with keys and empty
values only.

### Rule 6 — One manual step per issue, and only one

Publishing an issue takes exactly one human action beyond writing it: run
`npm run sync-issues`, review, commit, push. Nothing else may require a
hand-edit — not titles, dates, counts, ordering, sitemap entries, navigation or
social cards. If you catch yourself writing a hardcoded issue reference or a
hardcoded year, derive it instead.

### Rule 7 — Do not touch external accounts

Do not log into or configure Beehiiv, GitHub, Vercel or any DNS provider. Where a
step needs account access, write instructions in `DEPLOY.md` instead.

## 5. Directory map

```
content/issues/            The archive of record. One .md per issue. Hand-editable.
scripts/sync-issues.ts     Pulls new issues from Beehiiv RSS. The ONLY Beehiiv code.
scripts/build-preview.ts   Review tooling. Folds the built site into one HTML file.
src/config/                Every fact the site states, and the navigation.
  publication.ts             The facts. Pure data, no side effects, safe anywhere.
  input-ledger.ts            Where each fact came from + the launch guard. SERVER ONLY.
  coverage.ts                The tracked topics. Home and /coverage both read it.
  nav.ts                     Header, footer and sitemap routes.
src/lib/content/           The typed content layer. See section 6.
src/lib/env.ts             Environment access and URL resolution.
src/lib/format.ts          Dates, issue numbers, reading time.
src/lib/og.ts              Font data and colours for generated images.
src/lib/structured-data.ts JSON-LD builders.
src/components/            Presentational components. One client component.
src/app/                   Routes, metadata routes, icons, error boundaries.
src/assets/fonts/          Source Serif 4 TTFs, for icon and social card rendering.
```

## 6. Content architecture

**Issues live in this repository as files. This repo is the archive of record.**
Beehiiv is the authoring tool and the email sender, not a runtime dependency. The
site never fetches the feed at request time or at build time.

- Pages and components import from `@/lib/content` and nothing else.
- **Pages must never import a source implementation directly**, reference RSS, or
  know that Beehiiv exists.
- Nothing under `src/` may import the RSS parser, `sanitize-html`, or anything in
  `scripts/`.

All three of those are enforced by `no-restricted-imports` rules in
`eslint.config.mjs`, so breaking the boundary fails the lint rather than quietly
coupling the site to an external service.

Issue files are `content/issues/NNNN-slug.md`. `NNNN` is a **sort key, not the
issue number** — a numbering gap or a special issue must not corrupt ordering.
`slug` is **permanent**: once committed it is a URL someone may have linked, and
if it truly must change, add a redirect in `next.config.ts`. `issueNumber` may be
`null` and is never derived from directory position. The body is sanitised once,
at sync time, and read as-is thereafter.

### Failure modes, all handled in `local-files.ts`

- Malformed frontmatter logs a warning naming the file and is skipped. One bad
  file never takes down the build.
- An unparseable `publishedAt` means the date is omitted. **Today's date is never
  substituted.**
- A duplicate slug is refused, because slugs are permanent URLs.
- `getIssue()` returns `null` for an unknown slug and the route calls `notFound()`.

### Archive completeness

The repo holds every issue ever synced, permanently, so `/briefings` can honestly
be called a complete archive. **That depends on syncing before an issue ages out
of the feed window** (Beehiiv commonly exposes about twenty items). Any issue
published before this system existed must be back-filled — either sync it now
while it is still in the window, or write the file by hand.

## 7. Dependencies

Runtime: `gray-matter`, `clsx`, `@tailwindcss/typography`.
Dev (sync script and review tooling only): `fast-xml-parser`, `sanitize-html`,
`@types/sanitize-html`, `tsx`.

Forbidden without asking: any UI kit, animation library, state library, CMS or
database client, `moment`/`date-fns` (use `Intl.DateTimeFormat`), analytics
package, test framework, MDX tooling, or icon library.

## 8. The publishing workflow

This is the one recurring manual step in the project.

```
1. Write and send the issue in Beehiiv, as normal.
2. npm run sync-issues
3. Review the new file in content/issues/ — check the HTML converted cleanly.
4. git add content/issues/ && git commit -m "content: add issue N"
5. git push   (Vercel deploys automatically)
```

**Sync promptly after each send.** An issue that falls out of the feed window
before syncing is not recoverable by the script and has to be copied by hand.

## 9. Design tokens

Defined in `src/app/globals.css`. Derived from the existing Novus Data logo and
settled — do not reinterpret them.

| Token | Hex | Role | Contrast on `--ink` |
|---|---|---|---|
| `--ink` | `#070C20` | Page background | — |
| `--surface` | `#0E1529` | Raised panels | — |
| `--surface-2` | `#161F38` | Hover / secondary raised | — |
| `--border` | `rgba(255,255,255,0.08)` | Default hairline | — |
| `--border-strong` | `#222D4A` | Emphasised division | — |
| `--text` | `#F4F6FA` | Primary text | ~17:1 |
| `--text-muted` | `#9395A0` | Metadata, secondary text | 6.5:1 |
| `--accent` | `#4C618A` | **Structural only** — borders, fills, non-text marks | **3.1:1 — fails AA for text** |
| `--accent-text` | `#7B92BE` | Links, focus rings, interactive text | 6.2:1 |

**`--accent` is structural-only.** `#4C618A` fails WCAG AA for body text on the
navy background at 3.1:1 against a 4.5:1 requirement. Use `--accent-text` for
anything read or clicked. **Do not "correct" this back during a polish pass.**

**Reading surface (settled — do not relitigate):** the site is dark throughout,
issue pages included. Long-form legibility is handled by type, not by inverting
to a light theme mid-site: body at `1.125rem` / `1.75` in `--text` (17:1), measure
capped at 66ch. A light article page inside a dark site fragments the brand.

Tailwind utility names map onto these: `bg-ink`, `bg-surface`, `bg-surface-2`,
`text-fg`, `text-muted`, `text-link`, `border-hairline`, `border-rule`,
`border-accent`.

## 10. Feed findings

**Not yet established.** No `BEEHIIV_RSS_URL` was supplied, so the four checks the
brief asks for could not be run against the real feed:

1. How many `<item>` elements the feed returns — **unknown**.
2. Whether `content:encoded` carries full post HTML or only a summary — **unknown**.
   The sync script warns per item when a body is missing, so this will be obvious
   on the first real run.
3. The exact format of `<link>` values — **unknown**; slug derivation takes the
   final path segment and falls back to slugifying the title.
4. Whether `<enclosure>` or `media:content` supplies a cover image — **unknown**;
   the script reads `enclosure`, `media:content` and `media:thumbnail`, in that order.

The script was verified end to end against a local feed server reproducing a
Beehiiv-shaped feed (CDATA titles, `content:encoded` bodies, enclosures,
categories, a summary-only item). **Run it against the real feed and record the
four answers here.**

## 11. Environment variables

| Key | Purpose | Required | Read by |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical origin | No — falls back to `$VERCEL_URL`, then localhost | Site |
| `NEXT_PUBLIC_BEEHIIV_SUBSCRIBE_URL` | Subscribe destination | **Yes, before launch** | Site |
| `NEXT_PUBLIC_BEEHIIV_HOME_URL` | Footer link to the publication | No | Site |
| `NEXT_PUBLIC_BEEHIIV_FEED_URL` | Footer RSS link for readers | No | Site |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Public contact address | **Yes, before launch** | Site |
| `CONTENT_SOURCE` | `local` (default) or `fixtures` | No | Site |
| `NOVUS_ALLOW_INCOMPLETE` | Allows a production build with unanswered inputs | No — **never set on Vercel** | Site |
| `NOVUS_CONTENT_DIR` | Overrides the archive directory | No — review tooling only, **never set on Vercel** | Site |
| `BEEHIIV_RSS_URL` | The feed to sync from | Only to run the sync | **Sync script only** — not needed on Vercel |

## 12. Commands

```
npm run dev           development server
npm run build         production build (strict — fails on unanswered inputs)
npm run typecheck     tsc --noEmit
npm run lint          eslint
npm run sync-issues   pull new issues from Beehiiv
npm run preview       build the single-file review preview
```

## 13. Out of scope for v1

Do not build, scaffold or stub: authentication or gated content; payments or paid
tiers; a database, CMS or admin interface; self-hosted email or subscriber
management; live market-data APIs, charts, dashboards or an indicators layer;
search, tag filtering or comments; analytics or tracking; a test framework; a
custom email capture form or any backend endpoint; MDX tooling; a scheduled sync
workflow; a mobile app; a dark/light mode toggle; a Content Security Policy.

**Vercel's Hobby tier is non-commercial-use only.** The site as specified — free
newsletter, no transactions — is compliant. Paid subscriptions or ads would
require a Pro plan.

If a task appears to need any of the above, stop and ask.

## 14. Phase 2 seam

When live indicator data arrives it becomes a **separate typed layer** at
`src/lib/indicators/`, mirroring the content-layer pattern: its own types, its own
source implementations, its own public API. It must **not** be bolted onto
`ContentSource` — issues and indicators have different shapes, different refresh
characteristics and different failure modes, and merging them would make both
harder to change.

A scheduled GitHub Action could later run `sync-issues` automatically. Both are
documented intent; neither is coded.

## 15. Open questions and TODOs

Tracked in `HANDOFF.md`, which is the live list. In short: the author's name and
verifiable bio facts, the contact address, the three Beehiiv URLs, the publishing
cadence, the real logo file, and confirmation of the drafted topic list and
methodology statement.
