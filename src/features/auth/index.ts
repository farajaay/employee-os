/**
 * Authentication — Supabase email + password. No social sign-in.
 *
 * M-05 moves the existing sign-in flow here unchanged. M-23 swaps the session
 * store for the Capacitor Preferences adapter on native, which is what fixes the
 * silent logout when WKWebView evicts `localStorage`.
 *
 * Guardrail: never guess at anything touching authentication. Auth writes are
 * never queued in the outbox (M-18) — they fail loudly instead.
 *
 * The email and password inputs are Latin-script and stay `direction: ltr` inside
 * the right-to-left interface. Do not remove that (M-15).
 */

export const AUTH_STORAGE_KEY = 'employee-os.auth';
