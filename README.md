# Employee OS

A personal creative-professional work operating system. Arabic, right-to-left, five
product areas: اليوم (Today) · المشاريع (Projects) · Workflow · Event Radar · Career.

This repository takes the product from a single-file static web app to a store-published
mobile application: **Vite + TypeScript → installable PWA → Capacitor iOS/Android →
App Store + Google Play.** The backend is an existing Supabase project (Auth + Postgres +
RLS + Storage) whose contract does not change.

Issued as programme **FWO-MOB-001 Rev.0** under the earlier product name *Fatimah Work OS*.
See [`docs/programme/REV-NOTES.md`](docs/programme/REV-NOTES.md) for what the rename did and
did not change.

## Read these first

| File | What it is |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Agent guardrails. Read at the start of **every** session, before any code. |
| [`MOBILE_BUILD_PLAN.md`](MOBILE_BUILD_PLAN.md) | The work plan — 41 tickets, M-00 to M-40, in ten phases. |
| [`docs/programme/`](docs/programme/) | The issued programme document and its two architecture diagrams. |

**Work one ticket per session.** A ticket is done when its *Done when* criteria are
demonstrated — a screenshot, a passing test, a device recording — not when the code
looks correct.

## Getting started

```bash
npm install
cp .env.example .env      # fill in the Supabase publishable key
npm run dev
```

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | Vite dev server on :5173 |
| `npm run build` | `tsc --noEmit` then `vite build` → `dist/` |
| `npm run lint` | ESLint over `src`, zero warnings tolerated |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright (from M-33) |
| `npm run sync` | Build, then `cap sync` (from M-20) |
| `npm run ios` / `npm run android` | Open the native project (from M-20) |

## Where things go

```
src/
  main.ts                 entry
  app/                    router, shell, state, generated DB types (M-07)
  features/               one module per view — no Supabase calls, ever (M-08)
  data/                   supabase client, session storage, cache, outbox
  data/repositories/      one module per relation (M-08) — all queries live here
  platform/               capability adapters: push, camera, biometric, share, haptics
  styles/                 tokens, base, layout, components, safe-area
  sw/                     custom service worker (M-11)
docs/baseline/            reference screenshots (M-01)
docs/programme/           FWO-MOB-001 Rev.0 + diagrams
tests/                    unit (Vitest) and e2e (Playwright)
```

## Current state

Phase 0 and **M-03** only. The `src/` tree is a compiling skeleton: the router, shell
and state store are real, the five view modules render their Arabic headings, and the
outbox, cache and Supabase-config contracts are fixed and unit-tested. Everything else
is a documented stub naming the ticket that fills it.

The product's own markup, CSS and behaviour are **not here yet** — **M-00** imports the
live `index.html`, and **M-04**/**M-05** move its styles and scripts into this tree
without changing a single rule or behaviour.

## Non-negotiables

1. The visual design does not change. Tokens come from the existing `:root` block, verbatim.
2. No framework rewrite — no React, Vue, Svelte, Flutter or React Native.
3. No schema, RLS or migration changes except M-24, M-25 and M-29, and then only additive.
4. No secrets in the repo. Publishable client key only, via `VITE_` env vars.
5. No ATEMA data, credentials or infrastructure. Ever.
6. The web build stays shippable at every commit.
