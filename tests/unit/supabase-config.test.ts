import { describe, expect, it } from 'vitest';
import { MissingSupabaseConfigError, readSupabaseConfig } from '../../src/data/supabase';

describe('readSupabaseConfig', () => {
  it('reads the publishable client configuration', () => {
    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'anon-key'
      })
    ).toEqual({ url: 'https://example.supabase.co', anonKey: 'anon-key' });
  });

  it('names every missing variable', () => {
    expect(() => readSupabaseConfig({})).toThrow(MissingSupabaseConfigError);
    expect(() => readSupabaseConfig({})).toThrow(/VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY/);
  });

  it('rejects a partially configured environment', () => {
    expect(() => readSupabaseConfig({ VITE_SUPABASE_URL: 'https://example.supabase.co' })).toThrow(
      /VITE_SUPABASE_ANON_KEY/
    );
  });
});
