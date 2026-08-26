/**
 * Session storage adapter — one interface, two runtimes.
 *
 * Web today. M-23 adds the native branch via `@capacitor/preferences`, keeping
 * this exact signature so `src/data/supabase.ts` never learns which platform it
 * is on. See the platform adapter rule in MOBILE_BUILD_PLAN.md §5.
 */

export interface SessionStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export const secureStorage: SessionStorage = {
  async getItem(key) {
    return localStorage.getItem(key);
  },
  async setItem(key, value) {
    localStorage.setItem(key, value);
  },
  async removeItem(key) {
    localStorage.removeItem(key);
  }
};
