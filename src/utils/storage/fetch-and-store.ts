import { isAbort } from '..';
import { DAY_MS } from '../../constants/temporal';

import { lsKey } from './ls-key';
import { ttlLocalStorage } from './ttl-local-storage';

export const fetchAndStore = async <T>(
  memCache: Map<string, Promise<T> | T>,
  key: string,
  { ttlMs = DAY_MS }: { ttlMs: number } = {
    ttlMs: DAY_MS
  },
  fn: () => Promise<T>
): Promise<T> => {
  try {
    const value = await fn();

    ttlLocalStorage.set(lsKey(key), value, ttlMs);

    return value;
  } catch (e) {
    memCache.delete(key); // don't keep rejected promises

    if (isAbort(e as Error)) throw e;

    throw e;
  }
};
