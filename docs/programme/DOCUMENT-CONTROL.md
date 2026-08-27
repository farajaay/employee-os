# Document control — decisions of record

Programme `FWO-MOB-001`. Decisions the tickets require to be written down, and the
deviations from the issued Rev.0 that have been taken. Update this table when a
decision closes; do not delete a row.

## Decisions

| # | Decision | Status | Settled | Blocks |
|---|---|---|---|---|
| D-1 | Product name: **Employee OS** (from *Fatimah Work OS*) | **Closed** | 26 Aug 2026 | — |
| D-2 | Production domain — stays `fatimah-work-os.vercel.app`, moves to `employee-os.vercel.app`, or moves to a custom domain | **OPEN** | — | M-09, M-22 |
| D-3 | Audience — public App Store listing, TestFlight-only, or Apple Business Manager custom app | **OPEN** | — | Phase 7, M-40 |

### D-2 — production domain (open)

The deployment is still served from `fatimah-work-os.vercel.app`. The URL no longer
matches the product name. Nothing is broken by that: the app is fully login-gated, so
a store reviewer never sees the domain.

It must be settled **before M-09** (Vercel build configuration) and **before M-22**
(deep links), because moving it later means re-issuing:

- the Supabase Auth redirect and callback URLs,
- the iOS Universal Links `apple-app-site-association` file,
- the Android App Links `assetlinks.json` and its signing-certificate fingerprint,
- both store listings, if already submitted.

Moving it after the app is live in either store is materially more expensive than
moving it now. Recorded as open at the owner's instruction.

### D-3 — audience (open)

Carried forward from Rev.0. A single-user app will be **rejected** from a public App
Store listing. If the app remains for one named user, TestFlight distribution is the
correct and lower-friction answer. Must be settled before Phase 7.

## Deviations from Rev.0

| # | Deviation | Reason |
|---|---|---|
| V-1 | Ticket **M-00** added to Phase 0 | Rev.0 assumed the work happened inside the existing repository. Employee OS is a new repository, so the product source has to be imported and the rename carried through it before M-04/M-05 have anything to modularise. |
| V-2 | M-00 sourced the product from the **live deployment**, not from `farajaay/fatimah-work-os@main` | That repository is empty — zero commits, zero branches, confirmed by `git clone`, `git ls-remote`, the branches API and the contents API (409 *Git Repository is empty*). The deployed artifact at `https://fatimah-work-os.vercel.app/` was used instead and preserved pristine at `docs/baseline/index.upstream.html`. |
| V-3 | M-00's *Done when* — "the only diff against upstream is the product name" — verified against the **preserved artifact** rather than against a git upstream | There is no git upstream to diff against. See the check in `docs/baseline/README.md`; it passes. |
| V-4 | `vite` pinned to ^7 and `vitest` to ^3, above the versions implied by Rev.0 | The versions Rev.0's `package.json` resolved to carried one critical and one high advisory. Production audit was already clean; both are dev-tooling paths. Now zero advisories. |
| V-5 | **M-04** split the stylesheet into **six** files, not the three (`base` / `layout` / `components`) the plan names | CSS resolves equal-specificity ties by source order, so the split ranges must be **contiguous** or a tie can silently flip. Three names cannot cover 119 rules contiguously: the auth components sit *between* the base rules and the shell layout in the original. `views.css` and `responsive.css` were added so every range stays contiguous and the original cascade order is preserved exactly. Verified byte-for-byte — see below. |

## Not renamed, deliberately

The rename covers the product name only. These stayed as they are, and changing them
would be a defect:

| Occurrence | Why it stays |
|---|---|
| `'مساء الخير فاطمة'` | A personal greeting addressing the owner by name. Not the product name. |
| `owner_label: 'Fatimah'` (×3) | A **data value** written into `tasks` rows. Changing it would alter what is written to the production database and split new rows from every existing one. |

## Blocked

| # | Blocked item | Blocker | Needs |
|---|---|---|---|
| B-1 | **M-01** — tag `v0-web-baseline` pushed | This session's git proxy rejects `refs/tags/*` while accepting `refs/heads/*`. Four retries, annotated and lightweight both; `git ls-remote --tags` stays empty. No tag- or release-creation tool is exposed on the GitHub MCP server either. | The tag created on `95234f8` from a machine with normal git access, or via the GitHub UI (Releases → new tag on `95234f8`). |
| B-2 | **M-01** — the 15 baseline screenshots | The app is fully login-gated: `showAuth()` keeps `#app` hidden until Supabase returns a session, so only the auth screen renders. 3 of 15 captured. | A demo account. `BASELINE_EMAIL=... BASELINE_PASSWORD=... npm run baseline`. The same account Apple needs for the M-40 review notes — creating it now settles two tickets at once. |

B-2 no longer blocks **M-04**. Its *Done when* — "no computed style differs from
`docs/baseline/`" — was met by proving rule-for-rule identity against the preserved
original instead (`npm run verify:css`), which is stronger than a screenshot diff:
it covers all five views, including the login-gated ones that cannot be rendered at
all. The three reachable screens were also pixel-compared at zero tolerance.

B-2 still blocks **M-01** itself, and the twelve view screenshots remain the right
regression reference for **M-13**, **M-14** and **M-15**, where layout genuinely
changes and rule identity is no longer the question.
