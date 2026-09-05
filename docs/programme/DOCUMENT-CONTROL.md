# Document control — decisions of record

Programme `FWO-MOB-001`. Decisions the tickets require to be written down, and the
deviations from the issued Rev.0 that have been taken. Update this table when a
decision closes; do not delete a row.

## Decisions

| # | Decision | Status | Settled | Blocks |
|---|---|---|---|---|
| D-1 | Product name: **Employee OS** (from *Fatimah Work OS*) | **Closed** | 26 Aug 2026 | — |
| D-2 | Production domain | **Default taken** — stays `fatimah-work-os.vercel.app` | 5 Sep 2026 | — |
| D-3 | Audience | **Default taken** — TestFlight / not a public listing | 5 Sep 2026 | — |
| D-4 | The `F` monogram | **Default taken** — keeps `F` | 5 Sep 2026 | — |

Each of these was open pending the owner's answer and is now settled by taking the
**reversible** option, so the programme is not blocked on a decision. Each stays
reversible until the ticket named below acts on it; say the word and it changes.

| # | Default taken | Why this one is the reversible choice | Reverses freely until |
|---|---|---|---|
| D-2 | Keep the current domain | Changing nothing costs nothing. Moving later means re-issuing the Supabase Auth callbacks, `apple-app-site-association`, `assetlinks.json` and any live listings — but none of those exist yet, so the cost of deferring is currently zero. | **M-22** builds deep links |
| D-3 | TestFlight, not a public listing | A single-user app is **rejected** from public listing, so public is the option that can fail; TestFlight cannot. Going public later is an ordinary submission. | **M-40** writes the listings |
| D-4 | Keep the `F` | The established mark, and the guardrails forbid redesigning the visual language unprompted. The icons are provisional anyway (V-7) and must be regenerated on macOS regardless. | **M-21** generates native icons |

## Deviations from Rev.0

| # | Deviation | Reason |
|---|---|---|
| V-1 | Ticket **M-00** added to Phase 0 | Rev.0 assumed the work happened inside the existing repository. Employee OS is a new repository, so the product source has to be imported and the rename carried through it before M-04/M-05 have anything to modularise. |
| V-2 | M-00 sourced the product from the **live deployment**, not from `farajaay/fatimah-work-os@main` | That repository is empty — zero commits, zero branches, confirmed by `git clone`, `git ls-remote`, the branches API and the contents API (409 *Git Repository is empty*). The deployed artifact at `https://fatimah-work-os.vercel.app/` was used instead and preserved pristine at `docs/baseline/index.upstream.html`. |
| V-3 | M-00's *Done when* — "the only diff against upstream is the product name" — verified against the **preserved artifact** rather than against a git upstream | There is no git upstream to diff against. See the check in `docs/baseline/README.md`; it passes. |
| V-4 | `vite` pinned to ^7 and `vitest` to ^3, above the versions implied by Rev.0 | The versions Rev.0's `package.json` resolved to carried one critical and one high advisory. Production audit was already clean; both are dev-tooling paths. Now zero advisories. |
| V-5 | **M-04** split the stylesheet into **six** files, not the three (`base` / `layout` / `components`) the plan names | CSS resolves equal-specificity ties by source order, so the split ranges must be **contiguous** or a tie can silently flip. Three names cannot cover 119 rules contiguously: the auth components sit *between* the base rules and the shell layout in the original. `views.css` and `responsive.css` were added so every range stays contiguous and the original cascade order is preserved exactly. Verified byte-for-byte — see below. |

| V-6 | **Phase 2 (M-10) started before Phase 1 finished** | Rev.0 says not to start a phase until the previous one's tickets are all satisfied. Phase 1 cannot finish here: M-05 stage 2 needs the login gate opened (B-2), M-07 needs Supabase project credentials to run `supabase gen types`, M-08 depends on M-07, and M-09 depends on the open domain decision D-2 plus Vercel access. M-10 depends on none of them and is the installability groundwork the whole mobile programme rests on, so it went first rather than idling. |
| V-7 | **M-10's icons are provisional** | The icon set is rendered from the app's own monogram CSS, whose stack is `Didot, "Bodoni 72", Georgia, serif`. None of those exist on Linux, so the glyph is a fallback serif rather than the brand letterform. `scripts/generate-icons.mjs` detects this by measurement and marks the output provisional. Regenerate on macOS before any store submission — and settle D-4 first, since the letter itself may change. |

## Not renamed, deliberately

The rename covers the product name only. These stayed as they are, and changing them
would be a defect:

| Occurrence | Why it stays |
|---|---|
| `'مساء الخير فاطمة'` | A personal greeting addressing the owner by name. Not the product name. |
| `owner_label: 'Fatimah'` (×3) | A **data value** written into `tasks` rows. Changing it would alter what is written to the production database and split new rows from every existing one. |
| `<h1>FATIMAH AHMED ALI BOHASSAN</h1>` in the Career Vault CV | The owner's **real name on their own CV**. Not the product name. Renaming it would be a serious defect. |
| The `F` monogram (auth hero and sidebar) | A design element, not a text label. The guardrails forbid redesigning the visual language, and M-10 derives the app icons from this exact monogram. Changing it to `E` is a branding decision for the owner — see D-4. |

### Corrected after the fact

**M-00 missed the sidebar brand.** The sidebar rendered the product name as
`<b>FATIMAH</b>` + `<div class="eyebrow">WORK OS</div>` — split across two elements,
so M-00's exact-phrase replacement of `Fatimah Work OS` never matched it. It read
"FATIMAH / WORK OS" in the running app for three commits. Now `EMPLOYEE` / `OS`,
preserving the original element structure. Found while reviewing the markup at M-10.

## Blocked

| # | Blocked item | Blocker | Needs |
|---|---|---|---|
| B-1 | **M-01** — tag `v0-web-baseline` pushed | This session's git proxy rejects `refs/tags/*` while accepting `refs/heads/*`. Four retries, annotated and lightweight both; `git ls-remote --tags` stays empty. No tag- or release-creation tool is exposed on the GitHub MCP server either. | **Downgraded, not blocking.** The baseline is already pinned two better ways: commit `95234f8` is named throughout this document, and the pristine pre-rename artifact is committed at `docs/baseline/index.upstream.html`. The tag is convenience. Add it from any normal git checkout if wanted. |
| B-2 | **M-01** — the baseline screenshots | The app is login-gated AND membership-gated: `boot()` signs a user straight back out unless a `workspace_members` row exists, so signing up alone reaches nothing. | **Largely resolved.** All 18 screenshots are captured against the fixture workspace, and every view is now rendered, measured and regression-tested with realistic Arabic content. What remains needs a real account: proving the queries match the live schema, that RLS returns what is expected, and that writes land. |

B-2 no longer blocks **M-04**. Its *Done when* — "no computed style differs from
`docs/baseline/`" — was met by proving rule-for-rule identity against the preserved
original instead (`npm run verify:css`), which is stronger than a screenshot diff:
it covers all five views, including the login-gated ones that cannot be rendered at
all. The three reachable screens were also pixel-compared at zero tolerance.

B-2 still blocks **M-01** itself, and the twelve view screenshots remain the right
regression reference for **M-13**, **M-14** and **M-15**, where layout genuinely
changes and rule identity is no longer the question.

## Operational — required before this branch reaches production

**Vercel must carry the Supabase env vars before `feat/mobile-app` is merged or
deployed.** M-06 removed the hardcoded URL and key from `index.html`; the build now
reads them from the environment and Vite inlines them at build time. A production
build without them throws `MissingSupabaseConfigError` and the app will not start.

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | the existing project URL, unchanged |
| `VITE_SUPABASE_ANON_KEY` | the existing **publishable** (`sb_publishable_…`) key, unchanged |

Publishable client values only. A service-role key in a `VITE_` variable is shipped to
every user and is a total compromise of the database. CI guards the build output
against `service_role` and `sb_secret` strings.

Neither value is secret and neither changed — the same pair that was hardcoded in the
deployed `index.html`, and still present in `docs/baseline/index.upstream.html`.
