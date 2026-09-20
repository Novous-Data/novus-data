# Contributing to Novus Data

This is a two-person publication. This file is the part that has to be shared,
because the register's value is that every claim on it was made to the *same*
standard — and a standard only one of us is applying is not a standard.

Read `START-HERE.md` for where things live. Read `CLAUDE.md` for why. This file
is about how we work together.

---

## The one rule everything else follows from

> **An assessment that cannot be checked does not render.**

The site enforces this in code, not in editorial habit. An exposure missing any
of these four is silently dropped at load time:

1. **a mechanism** — the sentence saying *how* the problem reaches the company.
   "Affected" is not a finding. "Routes roughly a fifth of its Asia–Europe
   volume through the canal" is.
2. **a confidence** — `reported`, `inferred` or `estimated`.
3. **an `asOf` date** — when the assessment was last true.
4. **at least one source** — a followable http(s) URL and a publisher.

A disruption with no source of its own is skipped entirely.

**Do not relax this to get something onto the chart.** The constraint *is* the
product. It is the reason a sceptical reader has any cause to believe the rest.

---

## Adding a register entry

```bash
npm run new-disruption
```

Use the scaffolder rather than writing the file by hand. It prompts every
required field, validates each answer against the same rules the loader
enforces, shows you the file, and writes it only when you confirm. Hand-written
files fail *silently on the page* — you find out by noticing your entry isn't
there.

Then:

```bash
npm run doctor      # lists anything the site refused or corrected
git add content/disruptions/
git commit -m "register: <what it is>"
git push
```

### What makes a good entry

- **A primary source exists.** A canal or port authority notice, a regulator, a
  customs release, a company's own filing. Trade press is for *finding* stories,
  not settling them.
- **The company is named and defensible.** "Global shipping" is not an exposure.
  A named carrier with a stated route is.
- **It moves on a timescale we can track.** Weekly or monthly. Something that
  moves hourly will always be stale on a static site.

### What gets rejected in review

- An exposure whose mechanism is a restatement of the disruption.
- `reported` confidence where the source is a news article paraphrasing a
  company, rather than the company.
- A severity that the sources do not support. `estimated` exists for a reason —
  use it and say so.
- Any figure not present in a cited source. **Empty is better than invented.**

---

## Attribution

`publication.authors` in `src/config/publication.ts` is the masthead. The first
entry is the editor. Every author has a permanent `id`.

Register entries carry `author: "<id>"`, and the entry page shows **Recorded
by** once there is more than one of us. That field exists because with two
writers a site-wide byline stops being true, and "who made this call" has to
stay answerable — that is the register's entire claim.

An `id` is permanent once any entry references it. Changing one silently
detaches every assessment that person made.

---

## Review

**One person has final say on what publishes: the editor** (the first entry in
`publication.authors`). This is not about seniority. The register's credibility
comes from one consistent judgement about what clears the bar, and two people
applying "is this mechanism good enough" differently is the main quality risk
this project has.

Everything else is open. Code, tooling, design, the alerts service, the
roadmap — argue for it and make the change.

### Branches and pull requests

- Never commit directly to the default branch.
- Branch, push, open a pull request, and let the other person look at it.
- For register entries specifically: the PR should let the reviewer follow every
  source without leaving the diff. If they can't check it, neither can a reader.

---

## Before every push

```bash
npm run check
```

Typecheck, lint and doctor in one. If it is clean, the Vercel build will not
fail for a reason you could have caught in ten seconds.

---

## Things that are settled, and why

Changing any of these is a real decision, not a tidy-up. Each has bitten once or
is load-bearing. `CLAUDE.md` has the full reasoning.

| Settled | Why |
|---|---|
| No composite risk score, ever | It would look like data, travel like data, and trace back to nothing — on a site whose whole argument is that it publishes none |
| No predictions or forecasts | Assessments with an as-of date are defensible; a prediction is a bet we did not need to take |
| Severity is never carried by colour alone | Visually-hidden text, a legend, a table view and a texture channel all exist for this |
| `--accent` is structural-only | It fails WCAG AA for text at 3.1:1. Use `--accent-text` for anything read or clicked |
| `.prose-novus` is deliberately unlayered | `@tailwindcss/typography` registers `.prose` in the utilities layer and wins otherwise |
| It is `src/proxy.ts`, not `middleware.ts` | Next 16 renamed it. Every Supabase guide still shows the old name |
| Feed discovery is a `<link>` element | As metadata it renders on zero routes, silently |
| The alerts service lives in a separate repo | It is the component that has to stay up; merging it makes every notification change a deploy of the website |

---

## Never

- **Never commit a secret.** `.env.local` is git-ignored. `.env.example` holds
  keys with empty values only. This repository is public and git history is
  permanent.
- **Never add `NEXT_PUBLIC_` to a variable to silence an undefined error.** That
  prefix inlines the value into the browser bundle. `SUPABASE_SERVICE_ROLE_KEY`
  bypasses every row-level security policy.
- **Never put reader data in this repository.** Accounts live in Supabase.
- **Never invent a number, a name, a date or a source.** If a layout wants a
  figure, use a real one or change the layout.
