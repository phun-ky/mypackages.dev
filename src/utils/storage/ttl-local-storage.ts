import { DAY_MS } from '../../constants/temporal';

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(key: string, value: any, ttlMs = DAY_MS) {
    try {
      const payload = { v: value, exp: Date.now() + ttlMs };

      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      console.warn('localStorage cache set failed', e);
    }
  },

  del(key: string) {
    try {
      localStorage.removeItem(key);
      // eslint-disable-next-line no-empty
    } catch {}
  }
};
