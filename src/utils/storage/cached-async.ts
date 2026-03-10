import { DAY_MS } from '../../constants/temporal';

import { fetchAndStore } from './fetch-and-store';
import { ttlLocalStorage } from './ttl-local-storage';

import { lsKey } from './ls-key';

export const cachedAsync = async <T>(
  memCache: Map<string, Promise<T> | T>,
  key: string,
  { ttlMs = DAY_MS }: { ttlMs: number } = {
    ttlMs: DAY_MS
  },
  fn: () => Promise<T>
): Promise<T> => {
  // 1) memory (in-flight promise)
  if (memCache.has(key)) return await memCache.get(key)!;

  // 2) localStorage
  const hit = ttlLocalStorage.get(lsKey(key)) as T | null;

  if (hit != null) return hit;

  // 3) fetch + store (cache the PROMISE, not the awaited value)
  const p = fetchAndStore(memCache, key, { ttlMs }, fn);

  memCache.set(key, p);

  return p;
};
