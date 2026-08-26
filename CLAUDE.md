# Employee OS — Agent Guardrails

Read this file at the start of **every** session, before touching any code.
The work plan is in `MOBILE_BUILD_PLAN.md`. Work **one ticket at a time**.

---

## This is a mobile app programme

**The deliverable is a signed iOS binary on the App Store and a signed Android binary
on Google Play.** Not a website. Not a web app with a mobile layout.

The web build is the *means*, not the end. Capacitor packages a folder of compiled web
assets, so a bundler has to exist before there is anything to hand Xcode or Gradle —
that is the only reason Phases 1 and 2 look web-shaped. A ticket is not judged by
whether the site works; it is judged by whether it moves a store-ready binary closer.

Two consequences that bind every ticket:

- **A web view wrapped in a binary is rejected under App Store Guideline 4.2.** The
  native capabilities in Phase 6 — push, camera, biometric lock, native share, secure
  session storage — are a *requirement*, not polish.
- **Design and verify for the phone first.** 390 pt, one-handed, Arabic RTL, real
  devices. A change that only ever gets checked in a desktop browser is not verified.
  The sign-off matrix is iPhone SE, iPhone 15 Pro, a mid-range Android and one tablet.

If a decision would be right for a website and wrong for an app, it is wrong.

---

## What this project is

A personal creative-professional work operating system. Arabic, right-to-left,
five product areas: اليوم (Today) · المشاريع (Projects) · Workflow · Event Radar · Career.

Backend: an existing Supabase project (Auth + Postgres + RLS + Storage).
Frontend today: a single `index.html`. We are turning it into a Vite/TypeScript
modular app, then a PWA, then Capacitor iOS/Android binaries for the app stores.

Employee OS is the current product name. It was issued as *Fatimah Work OS* in
programme document `FWO-MOB-001 Rev.0` (`docs/programme/`). The programme, the
Supabase project, the schema and the visual language are unchanged by the rename —
see `docs/programme/REV-NOTES.md`.

---

## Never

- **Never** change the Supabase schema, RLS policies, or existing migrations.
  Exceptions: tickets M-24, M-25, M-29 — and then only *additive* changes.
- **Never** put a service-role key, database password, OpenAI key, GitHub token or any
  other secret in the repository. Publishable client key only, via `VITE_` env vars.
- **Never** reference, import or copy ATEMA data, credentials or infrastructure.
  This project is permanently isolated from it.
- **Never** redesign the visual language. Colours, typography and layout tokens come
  from the original `index.html` `:root` block and are preserved exactly.
- **Never** rewrite the app in React, Vue, Svelte, Flutter or React Native.
- **Never** work on more than one ticket in a session.
- **Never** commit `.env`.

## Always

- Confirm the ticket ID and its **Done when** criteria before writing code.
- Keep the interface Arabic and RTL. Latin-script inputs (email, password) stay LTR.
- Run before declaring done: `npm run build && npm run lint && npm test`
- After any UI-adjacent change, compare against `docs/baseline/` screenshots.
- Keep the web build shippable. It is a live product, not scaffolding.
- Commit per ticket, with the ID in the message: `M-14: safe-area insets and 44pt targets`
- After each ticket: push, and confirm the Vercel preview deployment still works.

## Definition of done

A ticket is done when its **Done when** criteria are *demonstrated* — a screenshot,
a passing test, or a device recording. Not when the code looks correct.

## When you are unsure

Stop and ask. Do not guess at:

- anything touching authentication, RLS, or data deletion
- anything that changes what the user sees
- anything that would require a schema change
- store policy questions

## Facts you will need

| Item | Value |
|---|---|
| App ID | `com.farajaay.employeeos` |
| App name | Employee OS |
| Web dir | `dist` |
| Production | `https://fatimah-work-os.vercel.app` (domain rename pending — see M-00) |
| Repo | `farajaay/employee-os` (private, branch `main`) |
| Work branch | `feat/mobile-app` |
| Brand background | `#fbf7f2` |
| Brand accent (rose) | `#a46b75` |
| Ink | `#2c2627` |
| Relations in use | `tasks`, `achievements`, `design_concepts`, `events`, `task_evidence`, `workflow_runs`, `workflow_run_steps`, `workflow_steps`, `workspace_members`, `v_control_exceptions`, `v_project_progress` |
