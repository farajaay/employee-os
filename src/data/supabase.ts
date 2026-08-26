/**
 * Supabase client configuration.
 *
 * M-06 installs `@supabase/supabase-js` as an npm dependency, deletes the jsDelivr
 * `<script>` tag, and calls `createClient(url, anonKey, ...)` here. Until then this
 * module only reads and validates the environment, so the contract is fixed before
 * the dependency lands.
 *
 * Only the publishable (anon) key is ever referenced. Row Level Security is the
 * security boundary. A service-role key must never reach a `VITE_` variable.
 *
 * M-23 supplies the auth storage adapter:
 *   createClient(url, anonKey, {
 *     auth: { storage: secureStorage, persistSession: true, autoRefreshToken: true }
 *   });
 */

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
