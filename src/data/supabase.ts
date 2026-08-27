/**
 * Supabase client.
 *
 * M-06 made `@supabase/supabase-js` an npm dependency, deleted the jsDelivr
 * `<script>` tag and moved the hardcoded URL and key into `VITE_` env vars.
 * Before that the app could not start at all if the CDN was unreachable —
 * `window.supabase` was undefined and `createClient` threw on load.
 *
 * Only the publishable (anon) key is ever referenced. Row Level Security is the
 * security boundary. A service-role key must never reach a `VITE_` variable.
 *
 * M-23 adds the auth storage adapter to the options below:
 *   auth: { storage: secureStorage, persistSession: true, autoRefreshToken: true }
 */

import { createClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export class MissingSupabaseConfigError extends Error {
  constructor(missing: readonly string[]) {
    super(
      `Missing Supabase environment variables: ${missing.join(', ')}. ` +
        'Copy .env.example to .env and fill in the publishable client key.'
    );
    this.name = 'MissingSupabaseConfigError';
  }
}

/** Validates a raw env bag and returns the client configuration. */
export function readSupabaseConfig(env: Record<string, string | undefined>): SupabaseConfig {
  const url = env['VITE_SUPABASE_URL'];
  const anonKey = env['VITE_SUPABASE_ANON_KEY'];

  const missing: string[] = [];
  if (!url) missing.push('VITE_SUPABASE_URL');
  if (!anonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  if (!url || !anonKey) throw new MissingSupabaseConfigError(missing);

  return { url, anonKey };
}

export function getSupabaseConfig(): SupabaseConfig {
  return readSupabaseConfig(import.meta.env as unknown as Record<string, string | undefined>);
}

const { url, anonKey } = getSupabaseConfig();

/**
 * The single client instance.
 *
 * The auth options are carried over VERBATIM from the original inline script —
 * `persistSession`, `autoRefreshToken` and `detectSessionInUrl` all keep their
 * original values. Changing any of them changes sign-in behaviour.
 */
export const db = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
