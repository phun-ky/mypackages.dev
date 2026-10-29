// Fetching from npm the way a shared-IP function has to (#69): as few
// requests as possible, one at a time, patient with 429s, and within a time
// budget. `fetch`, `sleep` and the clock are passed in, so tests can play npm.
import { type DayRange, rangePath, splitRange } from "../_shared/download-range.ts";
import type { DailyDownloads } from "../_shared/downloads.ts";

const NPM_REGISTRY = "https://registry.npmjs.org";
const NPM_API = "https://api.npmjs.org";
// npm's limits for bulk download queries, which only take unscoped names
const BULK_MAX = 128;
const BULK_MAX_DAYS = 365;

export type NpmClientOptions = {
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  // When to give up, as a time from `now()`
  deadline: number;
  maxTries?: number;
  // Pause between requests, so they're never in parallel bursts
  spacingMs?: number;
  maxWaitMs?: number;
};

/** Milliseconds to wait from a Retry-After header: seconds or an HTTP date. */
export const retryAfterMs = (value: string | null, now: number): number | null => {
  if (!value) return null;

  const seconds = Number(value);

  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;

  const date = Date.parse(value);

  return Number.isNaN(date) ? null : Math.max(0, date - now);
};

const parseDaily = (value: unknown): DailyDownloads[] => {
  const downloads = (value as { downloads?: unknown } | null)?.downloads;

  if (!Array.isArray(downloads)) return [];

  return downloads.filter(
    (d): d is DailyDownloads => typeof d?.day === "string" && Number.isFinite(d?.downloads),
  );
};

export const createNpmClient = ({
  fetch: fetchFn = (input, init) => fetch(input, init),
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now = Date.now,
  deadline,
  maxTries = 4,
  spacingMs = 1000,
  maxWaitMs = 30_000,
}: NpmClientOptions) => {
  const getJson = async (url: string): Promise<unknown> => {
    for (let attempt = 1; ; attempt++) {
      if (now() > deadline) throw new Error(`Out of time before ${url}`);

      const res = await fetchFn(url, { headers: { Accept: "application/json" } });

      if (res.ok) return await res.json();

      await res.body?.cancel();

      const retryable = res.status === 429 || res.status >= 500;

      if (!retryable || attempt >= maxTries) {
        throw new Error(`${res.status} from ${url} after ${attempt} tries`);
      }

      const wait = Math.min(
        retryAfterMs(res.headers.get("retry-after"), now()) ?? 2000 * 2 ** (attempt - 1),
        maxWaitMs,
      );

      if (now() + wait > deadline) {
        throw new Error(`${res.status} from ${url}, and out of time to wait ${wait} ms`);
      }

      await sleep(wait);
    }
  };

  /** The names of a user's packages. */
  const searchPackages = async (username: string, role: string, size = 250) => {
    const query = encodeURIComponent(`${role}:${username}`);
    const data = await getJson(`${NPM_REGISTRY}/-/v1/search?text=${query}&size=${size}`);
    const objects = (data as { objects?: unknown } | null)?.objects;

    if (!Array.isArray(objects)) throw new TypeError("npm search returned no objects");

    return objects.flatMap((object) => {
      const name = object?.package?.name;

      return typeof name === "string" && name ? [name] : [];
    });
  };

  /**
   * Daily downloads per package over `range`: unscoped packages in bulk
   * requests of at most 365 days each, scoped ones one at a time for the
   * whole range, `spacingMs` apart.
   */
  const dailyDownloads = async (names: string[], range: DayRange) => {
    const result = new Map<string, DailyDownloads[]>();
    const unscoped = names.filter((name) => !name.startsWith("@"));
    const scoped = names.filter((name) => name.startsWith("@"));
    let first = true;
    const pause = async () => {
      if (!first) await sleep(spacingMs);

      first = false;
    };

    const add = (name: string, daily: DailyDownloads[]) =>
      result.set(name, [...(result.get(name) ?? []), ...daily]);

    for (let i = 0; i < unscoped.length; i += BULK_MAX) {
      const chunk = unscoped.slice(i, i + BULK_MAX);

      for (const part of splitRange(range, BULK_MAX_DAYS)) {
        await pause();

        const data = await getJson(
          `${NPM_API}/downloads/range/${rangePath(part)}/${chunk.map(encodeURIComponent).join(",")}`,
        );

        // npm answers a single name with its result, and several with a map
        if (chunk.length === 1) {
          add(chunk[0], parseDaily(data));
        } else {
          const byName = (data ?? {}) as Record<string, unknown>;

          // Own keys only: a package can be called `constructor`
          for (const name of chunk) {
            add(name, parseDaily(Object.hasOwn(byName, name) ? byName[name] : null));
          }
        }
      }
    }

    for (const name of scoped) {
      await pause();
      result.set(
        name,
        parseDaily(
          await getJson(`${NPM_API}/downloads/range/${rangePath(range)}/${encodeURIComponent(name)}`),
        ),
      );
    }

    return result;
  };

  return { getJson, searchPackages, dailyDownloads };
};
