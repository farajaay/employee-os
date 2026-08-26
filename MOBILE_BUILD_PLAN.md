# Employee OS — Mobile App Build Plan (agent brief)

> Companion to `FWO-MOB-001 Rev.0` (`docs/programme/`). Lives at the repository root.
> Work **one ticket per session**. Read `CLAUDE.md` first, every session.
>
> Issued as *Fatimah Work OS*; the product is now **Employee OS**. Names, app ID and
> repository below reflect the rename. Nothing else about the programme changed —
> see `docs/programme/REV-NOTES.md`.

---

## 0. Context you need before writing any code

**What exists today**

- `index.html` — one file, ~30 KB, inline CSS + inline JS, `lang="ar" dir="rtl"`.
- `@supabase/supabase-js@2` loaded from **jsDelivr at runtime** (must become an npm dependency).
- Supabase URL + publishable key **hardcoded** (must become `VITE_` env vars).
- No build step. Vercel serves the file statically. `vercel.json` = `cleanUrls`, no `trailingSlash`.
- Five views: `home` (اليوم), `projects`, `workflow`, `events`, `career`.
- Eleven relations in use:
  `tasks`, `achievements`, `design_concepts`, `events`, `task_evidence`,
  `workflow_runs`, `workflow_run_steps`, `workflow_steps`, `workspace_members`,
  `v_control_exceptions`, `v_project_progress`.
- Auth: Supabase email + password. No social sign-in.
- Six migrations already applied in production. **Do not re-run or modify them.**

**Where we are going**

Single-file static site → Vite + TypeScript modular app → installable PWA →
Capacitor iOS/Android shells → App Store + Google Play.

**Non-negotiable constraints**

1. The visual design does not change. Colours, type and layout tokens come from the
   existing `:root` block and are preserved verbatim.
2. No framework rewrite (no React, Vue, Flutter, React Native).
3. No schema, RLS or migration changes except tickets M-24, M-25, M-29 — and then
   only additive.
4. No secrets in the repo. Publishable client key only, via env vars.
5. No ATEMA data, credentials or infrastructure. Ever.
6. The web build stays shippable at every commit.

---

## 1. Target repository structure

```
employee-os/
├─ .github/workflows/{ci,release-android,release-ios}.yml
├─ android/                        # Capacitor, committed
├─ ios/                            # Capacitor, committed
├─ public/{icons/,manifest.webmanifest}
├─ src/
│  ├─ main.ts
│  ├─ app/{router,shell,state,types}.ts
│  ├─ features/{today,projects,workflow,events,career,auth,settings}/
│  ├─ data/{supabase,session-storage,cache,outbox}.ts
│  ├─ data/repositories/*.ts       # one per table
│  ├─ platform/{capabilities,push,camera,biometric,share,haptics}.ts
│  ├─ styles/{tokens,base,layout,components,safe-area}.css
│  └─ sw/custom-sw.ts
├─ supabase/functions/{delete-account,dispatch-push,export-data}/
├─ tests/{unit,e2e}/
├─ docs/baseline/                  # M-01 reference screenshots
├─ docs/programme/                 # FWO-MOB-001 Rev.0 + diagrams
├─ capacitor.config.ts
├─ vite.config.ts
├─ .env.example
├─ CLAUDE.md
└─ MOBILE_BUILD_PLAN.md
```

---

## 2. Ticket backlog

Format: `ID — title` → **Do** / **Done when**.
Do not start a ticket until the previous phase's tickets are all *Done when* satisfied.

### Phase 0 — Baseline and guardrails

**M-00 — Carry the rename into the product** *(added at repository creation)*
Do: import the live `index.html` from `farajaay/fatimah-work-os@main` into this
repository unchanged; replace the user-visible product name with **Employee OS**
(interface string, `<title>`, any Arabic label) and nothing else; decide whether the
Vercel domain moves off `fatimah-work-os.vercel.app` and record the answer in the
document control table. Colours, type and layout tokens are untouched.
Done when: `index.html` is committed, the only diff against upstream is the product
name, and the domain decision is written down.

**M-01 — Tag baseline, capture reference screenshots**
Do: tag current prod commit `v0-web-baseline`; create branch `feat/mobile-app`;
screenshot all five views at 390 / 768 / 1440 px in Arabic RTL into `docs/baseline/`.
Done when: tag pushed, branch exists, 15 screenshots committed.

**M-02 — Author `CLAUDE.md`**
Do: commit the guardrails file at the repo root.
Done when: file present and matches the supplied content.

> **Human decision required before Phase 7:** audience — public App Store listing,
> TestFlight-only, or Apple Business Manager custom app. A single-user app will be
> rejected from public listing. Record the answer in the document control table.

### Phase 1 — Modularisation (highest risk: nothing should visibly change)

**M-03 — Scaffold Vite + TypeScript (strict)**
Done when: `npm run build` emits `dist/`; `tsc --noEmit` is clean.

**M-04 — Extract CSS tokens, split stylesheets**
Do: copy the `:root` custom properties **verbatim** into `src/styles/tokens.css`;
split the rest into `base` / `layout` / `components`. Change no rule.
Done when: no computed style differs from `docs/baseline/`.

**M-05 — Split JS into `src/app/` and `src/features/`**
Do: preserve every function's behaviour; only module boundaries change.
Done when: all five views behave identically; login / create task / complete task work.

**M-06 — Bundle Supabase, move config to env**
Do: `npm i @supabase/supabase-js`; delete the jsDelivr `<script>`; introduce
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; commit `.env.example`; gitignore `.env`.
Done when: zero CDN requests at runtime (check the network tab).

**M-07 — Generate typed row models**
Do: `supabase gen types typescript` → `src/app/types.ts`.
Done when: all eleven relations typed.

**M-08 — Typed repository per table**
Do: `src/data/repositories/<table>.ts`; move every query out of the views.
Done when: no `supabase.from(` appears anywhere under `src/features/`.

**M-09 — Vercel build configuration**
Do: build command `npm run build`, output `dist`. Domain and Supabase project unchanged
unless M-00 decided otherwise.
Done when: preview and production deploys succeed; login still works in prod.

### Phase 2 — PWA layer

**M-10 — `vite-plugin-pwa`, manifest, icons**
Do: manifest with `dir: "rtl"`, `lang: "ar"`, `display: "standalone"`, brand colours
`#fbf7f2` / `#a46b75`; icons 192, 512, maskable 512, apple-touch 180, store 1024,
derived from the existing "F" monogram.
Done when: installs to the home screen on iOS Safari and Android Chrome.

**M-11 — Workbox strategies + offline shell**
Do: precache the shell; network-first for Supabase REST with cached fallback;
stale-while-revalidate for static assets; a designed offline screen.
Done when: with the network off, the app opens to the offline state, not a browser error.

**M-12 — Service-worker update prompt**
Do: when a new SW is waiting, show a discreet Arabic "تحديث متاح" prompt.
Done when: a new build offers an update instead of reloading under the user.

### Phase 3 — Mobile UX

**M-13 — Responsive shell, bottom tabs < 900 px**
Do: five tabs mapping to the five existing views; keep the sidebar ≥ 900 px. One router.
Done when: all views reachable one-handed at 390 pt; no horizontal scroll.

**M-14 — Safe-area insets, 44 pt minimum targets**
Do: `env(safe-area-inset-*)` on every fixed element; raise undersized buttons
(several current ones are below 44 pt).
Done when: nothing sits under the notch or home indicator; audit shows no target < 44 pt.

**M-15 — RTL verification + skeleton loaders**
Do: check tab order, mirroring, and Latin-script inputs that must stay LTR
(email, password — already `direction: ltr` today, keep it). Replace blocking spinners.
Done when: RTL correct throughout; slow network reads as loading, not broken.

**M-16 — Pull-to-refresh on Today and Projects**
Done when: gesture refreshes and reconciles without a full page reload.

### Phase 4 — Offline and sync

**M-17 — IndexedDB read cache**
Do: `idb`; every view renders last-known data first, then refreshes and reconciles.
Done when: cold start renders cached content in < 3 s with no network.

**M-18 — Write outbox with idempotency + replay**

```ts
type OutboxEntry = {
  id: string;                    // uuid v4, also the idempotency key
  table: 'tasks' | 'achievements' | 'events' | 'workflow_runs';
  op: 'insert' | 'update' | 'delete';
  payload: Record<string, unknown>;
  createdAt: number;
  attempts: number;              // surface to the user after 5
};
```

Replay: FIFO by `createdAt`; exponential backoff; trigger on
`Network.addListener('networkStatusChange')` (native) and `online` (web).
Never queue auth operations or evidence deletions — fail loudly instead.
Done when: aeroplane-mode writes land **exactly once** on reconnect, no duplicates.

**M-19 — Conflict policy + pending-sync indicator**
Do: last-write-wins on `updated_at`, **except** task completion, which is monotonic
and never reverts. Show a pending count in the header.
Done when: a task completed offline stays completed after a stale server write.

### Phase 5 — Capacitor shells

**M-20 — Init + add platforms**

```bash
npm i @capacitor/core @capacitor/cli
npx cap init "Employee OS" com.farajaay.employeeos --web-dir=dist
npx cap add ios && npx cap add android
```

Done when: both projects build and launch on physical devices.

**M-21 — Icons, splash, status bar, edge-to-edge**
Do: `npx @capacitor/assets generate --iconBackgroundColor '#fbf7f2'`.
Done when: brand-correct launch experience on both platforms.

**M-22 — Android back button + deep links**
Do: back navigates the router, exits only from a root tab; Universal Links (iOS)
and App Links (Android) for auth callbacks and task URLs; restrict `allowNavigation`;
external links via `@capacitor/browser`.
Done when: back behaves correctly; deep links resolve to the right view.

### Phase 6 — Native capabilities (this is what closes Apple Guideline 4.2)

**M-23 — Secure session storage adapter**

```ts
// src/data/session-storage.ts
import { Preferences } from '@capacitor/preferences';
import { isNative } from '../platform/capabilities';

export const secureStorage = {
  async getItem(key: string) {
    return isNative() ? (await Preferences.get({ key })).value : localStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    isNative() ? await Preferences.set({ key, value }) : localStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    isNative() ? await Preferences.remove({ key }) : localStorage.removeItem(key);
  }
};

// src/data/supabase.ts
createClient(url, anonKey, {
  auth: { storage: secureStorage, persistSession: true, autoRefreshToken: true }
});
```

Done when: the session survives force-quit and OS storage eviction. (This also fixes
the silent-logout bug inherited from `localStorage` in WKWebView.)

**M-24 — Push notifications (client + Edge Function)**
Do: APNs + FCM registration, token stored per device, dispatch from a Supabase Edge
Function on task due dates and Event Radar changes.
Done when: a test notification arrives on both platforms **and** every feature still
works with permission denied. Apple forbids requiring push for core functionality.

**M-25 — Camera evidence capture with web fallback**
Do: `@capacitor/camera` → Supabase Storage → `task_evidence`; file input on web.
Done when: a photo taken on device is visible against the task on the web build too.

**M-26 — Biometric app lock**
Do: `capacitor-native-biometric`, opt-in, configurable grace period, passcode fallback.
Done when: backgrounding past the grace period prompts; fallback works.

**M-27 — Native share + haptics**
Done when: the share sheet opens with correct content; haptic fires on task completion.

**M-28 — Permission strings and rationale**
Do: `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSFaceIDUsageDescription`
in Arabic and English, each stating the real purpose. Android runtime requests shown
in context, never on first launch.
Done when: all strings present; no permission prompt appears at cold start.

### Phase 7 — Store compliance

**M-29 — In-app account deletion** *(Apple Guideline 5.1.1 v — mandatory)*
Do: Settings entry → consequence warning → confirmation → Edge Function using the
service role that removes the auth user and all owned rows.
Done when: deletion is complete and irreversible; login fails afterwards.

**M-30 — Data export to JSON**
Done when: the file contains every record the user owns and parses cleanly.

**M-31 — Privacy policy, terms, field inventory**
Do: publish both at stable public URLs, link from Settings and both store listings;
build a written field-level inventory of everything sent to Supabase, Sentry and the
push services. Fill the Play Data Safety form and the App Privacy label **from the
inventory**, not from memory.
Done when: URLs resolve; the inventory table is complete.

**M-32 — Anonymous access verification**
Do: anonymous REST call against all eleven relations.
Done when: zero rows returned on every one.

### Phase 8 — Quality gates

**M-33 — Playwright E2E**: auth, five views, task lifecycle, offline, outbox replay, deletion.
**M-34 — Vitest units**: outbox, cache, repositories — > 80 % coverage on those three.
**M-35 — Lighthouse in CI**: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, PWA passing.
**M-36 — Sentry**: release tagging, source maps uploaded from CI, PII scrubbing on.

Device matrix for sign-off: iPhone SE, iPhone 15 Pro, a mid-range Android, one tablet.
Cold start < 3 s on the slowest. VoiceOver and TalkBack navigable in Arabic;
dynamic type at 200 % with no clipping.

### Phase 9 — Release engineering

**M-37 — `ci.yml`**: lint, typecheck, unit, e2e, build on every PR; blocks merge.
**M-38 — `release-android.yml`**: tag → signed `.aab` → Play internal track.
**M-39 — `release-ios.yml`**: tag → macOS runner → `.ipa` → TestFlight.
**M-40 — Store listings**: Arabic + English, screenshots from the device matrix,
feature graphic 1024×500, English review notes describing the native capabilities and
**including the demo account credentials** (the app is fully login-gated; omitting them
is an automatic rejection).

Signing secrets live in encrypted repository secrets. **Back the Android keystore up
offline** — losing it permanently ends your ability to update the app.

Google Play rollout: internal → closed test (12 testers, 14 continuous days for
personal developer accounts) → staged production 10 → 50 → 100 %.
Apple: TestFlight internal → submission. Budget for one rejection round.

---

## 3. `package.json` scripts

```json
{
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "test": "vitest run",
  "test:e2e": "playwright test",
  "lint": "eslint src --max-warnings 0",
  "sync": "npm run build && npx cap sync",
  "ios": "npm run sync && npx cap open ios",
  "android": "npm run sync && npx cap open android",
  "assets": "npx @capacitor/assets generate --iconBackgroundColor '#fbf7f2'"
}
```

## 4. `capacitor.config.ts`

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.farajaay.employeeos',
  appName: 'Employee OS',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  ios: { contentInset: 'always', limitsNavigationsToAppBoundDomains: true },
  android: { adjustMarginsForEdgeToEdge: 'auto' },
  plugins: {
    SplashScreen: { launchAutoHide: false, backgroundColor: '#fbf7f2' },
    StatusBar: { style: 'LIGHT', backgroundColor: '#fbf7f2' },
    PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] }
  }
};
export default config;
```

## 5. Platform adapter rule

One code path, two runtimes. Feature modules ask for a capability; they never branch
on platform.

```ts
// src/platform/capabilities.ts
import { Capacitor } from '@capacitor/core';
export const isNative = () => Capacitor.isNativePlatform();

// correct
export const captureEvidence = () => isNative() ? nativeCamera() : fileInputFallback();

// wrong — never duplicate a view per platform
// if (Capacitor.getPlatform() === 'ios') { ... }
```
