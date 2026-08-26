/**
 * IndexedDB read cache — M-17.
 *
 * Contract: every view renders last-known data first, then refreshes and
 * reconciles. Cold start must render cached content in under 3 s with no network.
 *
 * M-17 backs this with `idb`. The interface is fixed here so repositories can be
 * written against it from M-08 onward.
 */

export interface ReadCache {
  read<T>(key: string): Promise<T | null>;
  write<T>(key: string, value: T): Promise<void>;
  clear(): Promise<void>;
}

/** In-memory stand-in. Replaced by the IndexedDB implementation at M-17. */
export function createMemoryCache(): ReadCache {
  const store = new Map<string, unknown>();
  return {
    async read<T>(key: string): Promise<T | null> {
      return store.has(key) ? (store.get(key) as T) : null;
    },
    async write<T>(key: string, value: T): Promise<void> {
      store.set(key, value);
    },
    async clear(): Promise<void> {
      store.clear();
    }
  };
}
