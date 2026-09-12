# Novus Data

The public website for **Novus Data**, a research briefing on global supply
chains, shipping and trade policy.

Built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS 4.
Statically generated, deployed on Vercel.

Issues are written and emailed in Beehiiv. They are then stored **in this
repository** as files, and this repository is the permanent archive. The website
never contacts Beehiiv at build time or at request time.

---

## Getting started

```bash
nvm use                 # Node 22 (minimum 20)
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev              # http://localhost:3000
```

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build. **Fails if a launch-critical input is still missing** — see below |
| `npm run start` | Serve a production build locally |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run sync-issues` | Pull new issues from the Beehiiv feed into `content/issues/` |
| `npm run preview` | Build a single-file review preview at `preview/novus-data-preview.html` |

## Environment variables

Copy `.env.example` to `.env.local`. `.env.local` is git-ignored and must never
be committed.

| Key | Purpose | Required |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical origin, no trailing slash | No — falls back to `$VERCEL_URL`, then `localhost` |
| `NEXT_PUBLIC_BEEHIIV_SUBSCRIBE_URL` | Where the subscribe buttons point | **Yes, before launch** |
| `NEXT_PUBLIC_BEEHIIV_HOME_URL` | Footer link to the Beehiiv publication | No |
| `NEXT_PUBLIC_BEEHIIV_FEED_URL` | Footer RSS link for readers | No |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Public contact address | **Yes, before launch** |
| `CONTENT_SOURCE` | `local` (default) or `fixtures` (development only) | No |
| `BEEHIIV_RSS_URL` | The feed the sync script reads | Only to run the sync. **Not needed on Vercel** |

### Why a build can fail on purpose

`src/config/publication.ts` refuses to produce a production build while a
launch-critical fact is still missing — currently the author's name, the
subscribe URL and the contact address. The error names exactly what is missing
and where to put it.

This is deliberate. An about page with no author, or a subscribe button that
goes nowhere, defeats the point of the site, and a loud build failure is a much
better outcome than shipping one. To build anyway for review purposes, set
`NOVUS_ALLOW_INCOMPLETE=1`. Never set it on Vercel.

---

## Publishing an issue

This is the only recurring manual step in the project.

```
1. Write and send the issue in Beehiiv, as normal.
2. npm run sync-issues
3. Review the new file in content/issues/ — check the HTML converted cleanly.
4. git add content/issues/ && git commit -m "content: add issue N"
5. git push   (Vercel deploys automatically)
```

Everything else updates itself: the home page hero, the archive, previous/next
navigation, the sitemap and the social cards.

**Sync promptly after each send.** The Beehiiv feed carries only a window of
recent items — commonly about twenty. An issue that falls out of that window
before it is synced cannot be recovered by the script and would have to be
written by hand.

### Sync options

```bash
npm run sync-issues                   # fetch and write anything new
npm run sync-issues -- --dry-run      # report what would be written, write nothing
npm run sync-issues -- --force slug   # deliberately re-pull and overwrite one issue
```

Existing files are never overwritten without `--force`, because a local file may
carry a hand-edited correction that is the better copy.

---

## How to change common things

| To change… | Edit | Notes |
|---|---|---|
| Any fact about the publication or author | `src/config/publication.ts` | Name, description, readers, cadence, methodology, disclaimer. Nothing factual is written inline in a page |
| The topics tracked | `src/config/coverage.ts` | The home page and `/coverage` both read this. Add, cut or reorder freely |
| Navigation, header or footer links | `src/config/nav.ts` | The sitemap derives from this too |
| Colours, type scale, spacing tokens | `src/app/globals.css` (`@theme`) | Tailwind 4 — there is no `tailwind.config.ts` |
| Page copy | The page file in `src/app/<route>/page.tsx` | Prose lives with its layout; facts do not |
| A typo in a published issue | The file in `content/issues/` | A normal edit and commit. Do not re-sync |
| Add a route | New folder in `src/app/`, then add it to `src/config/nav.ts` | The sitemap picks it up automatically |
| Subscribe destination | `NEXT_PUBLIC_BEEHIIV_SUBSCRIBE_URL` | Environment, not code |

### Things to leave alone

- **A slug in `content/issues/` is a permanent URL.** If one truly must change,
  add a redirect in `next.config.ts` rather than silently breaking the old link.
- **`--accent` (`#4C618A`) is structural only.** It fails WCAG AA for text on the
  navy background. Use `--accent-text` (`#7B92BE`) for anything read or clicked.
- **The `.prose-novus` rules in `globals.css` are deliberately unlayered.** Moving
  them into `@layer components` makes issue bodies lose to the typography
  plugin's defaults and render nearly invisibly.

---

## Project layout

```
content/issues/          The archive. One markdown file per issue
scripts/sync-issues.ts   Pulls issues from Beehiiv RSS. The only Beehiiv code
scripts/build-preview.ts Builds the single-file review preview
src/config/              Facts, topics and navigation
src/lib/content/         The typed content layer pages read from
src/app/                 Routes, metadata, icons, error boundaries
src/components/          Presentational components
```

Pages import from `@/lib/content` and never from a source implementation, so the
publication can move off Beehiiv without touching a page. ESLint enforces that
boundary.

## Further reading

- `CLAUDE.md` — architecture, rules and working notes
- `DEPLOY.md` — first deployment and the domain cutover
- `HANDOFF.md` — open questions, judgement calls and deferred work
