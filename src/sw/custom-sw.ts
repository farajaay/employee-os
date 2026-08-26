/**
 * Custom service worker — M-11.
 *
 * Strategies, once `vite-plugin-pwa` is wired up at M-10:
 *   - precache the app shell
 *   - network-first for Supabase REST, with a cached fallback
 *   - stale-while-revalidate for static assets
 *   - a designed offline screen, in Arabic — never the browser's error page
 *
 * M-12 adds the waiting-worker prompt ("تحديث متاح") rather than reloading the
 * page under the user.
 *
 * Not registered yet: `src/main.ts` picks this up at M-10.
 */

export {};
