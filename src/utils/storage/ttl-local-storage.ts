import { DEFAULT_OPTIONS } from '../../config';
import { DAY_MS } from '../../constants/temporal';

// localStorage holds about 5 million characters per site, shared with the
// Supabase session and settings. The caches here have the site's prefix,
// and make room among themselves when it's full (#112).

const PREFIX = DEFAULT_OPTIONS.cachePrefix;

/** Larger entries stay in the in-memory caches only: about 200 KB stored */
export const MAX_ENTRY_CHARS = 100_000;

// Keys from earlier versions of the site, removed by `sweep`
const LEGACY = [
  // Mixed the signed-in user's packages into other users' lists (#113)
  /^tracked-packages:[^:]+:maintainer$/,
  // Not per user (#110)
  /^supabase:ensured-packages$/
];

type Entry = { key: string; exp: number; size: number };

const isQuotaError = (e: unknown) =>
  e instanceof DOMException &&
  (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED');
// The site's entries, soonest to expire first. One that can't be read
// expires now.
const ownEntries = (): Entry[] => {
  const entries: Entry[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (!key?.startsWith(PREFIX)) continue;

    const raw = localStorage.getItem(key) ?? '';

    let exp = 0;

    try {
      exp = Number(JSON.parse(raw)?.exp) || 0;
    } catch {
      // Removed as expired
    }

    entries.push({ key, exp, size: key.length + raw.length });
  }

  return entries.sort((a, b) => a.exp - b.exp);
};

export const ttlLocalStorage = {
  get(key: string) {
    try {
      const raw = localStorage.getItem(key);

      if (!raw) return null;

      const parsed = JSON.parse(raw);

      if (!parsed || typeof parsed !== 'object') return null;

      // exp is required
      if (typeof parsed.exp !== 'number') {
        localStorage.removeItem(key);

        return null;
      }

      if (Date.now() > parsed.exp) {
        localStorage.removeItem(key);

        return null;
      }

      return parsed.v ?? null;
    } catch {
      // corrupt entry
      localStorage.removeItem(key);

      return null;
    }
  },

  /**
   * Stores `value` until `ttlMs` from now, and says whether it did. When
   * storage is full, removes the site's expired entries, then the ones that
   * expire soonest, until it fits. Values over MAX_ENTRY_CHARS aren't
   * stored.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(key: string, value: any, ttlMs = DAY_MS): boolean {
    let payload: string;

    try {
      payload = JSON.stringify({ v: value, exp: Date.now() + ttlMs });
    } catch {
      return false;
    }

    if (payload.length > MAX_ENTRY_CHARS) {
      this.del(key);

      return false;
    }

    try {
      // Making room reads every entry, so only when storage is full
      let candidates: Entry[] | null = null;

      for (;;) {
        try {
          localStorage.setItem(key, payload);

          return true;
        } catch (e) {
          if (!isQuotaError(e)) throw e;

          if (!candidates) {
            this.sweep();
            candidates = ownEntries().filter((entry) => entry.key !== key);
            continue;
          }

          const next = candidates.shift();

          if (!next) throw e;

          localStorage.removeItem(next.key);
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console -- a full or blocked cache only makes the site slower; this says why
      console.warn('localStorage cache set failed', e);

      return false;
    }
  },

  del(key: string) {
    try {
      localStorage.removeItem(key);
      // eslint-disable-next-line no-empty
    } catch {}
  },

  /**
   * Removes the site's expired entries, ones larger than MAX_ENTRY_CHARS,
   * and keys earlier versions of the site used.
   */
  sweep() {
    try {
      const now = Date.now();

      for (const { key, exp, size } of ownEntries()) {
        const name = key.slice(PREFIX.length);

        if (
          exp <= now ||
          size > MAX_ENTRY_CHARS ||
          LEGACY.some((pattern) => pattern.test(name))
        ) {
          localStorage.removeItem(key);
        }
      }
      // eslint-disable-next-line no-empty
    } catch {}
  }
};
