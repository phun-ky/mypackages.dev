// Pages through npm's search, which gives at most 250 results a request, up
// to a cap (#96). `fetch` is passed in, so tests can play npm.

const NPM_REGISTRY = "https://registry.npmjs.org";

// npm's most per request
export const PAGE_SIZE = 250;
// The most packages the site loads for a user: two pages
export const MAX_PACKAGES = 500;

type SearchObject = { package?: { name?: unknown } };

export type SearchResult = {
  objects: SearchObject[];
  total: number;
  time?: string;
};

export class SearchError extends Error {
  constructor(public status: number) {
    super(`Search failed: ${status}`);
  }
}

/** A requested size as a whole number from 1 to MAX_PACKAGES, 50 if none. */
export const clampSize = (n: unknown) => {
  const x = Number(n);

  if (!Number.isFinite(x)) return 50;

  return Math.max(1, Math.min(MAX_PACKAGES, Math.floor(x)));
};

export const searchUrl = (text: string, size: number, from: number) =>
  `${NPM_REGISTRY}/-/v1/search?text=${encodeURIComponent(text)}&size=${size}` +
  (from ? `&from=${from}` : "");

/**
 * Up to `size` results for `text`, and npm's `total`. Stops at `total`, at
 * `size`, and on an empty page. Throws a SearchError when the first page
 * fails; a later page failing returns what came before it, and `total`
 * still says how many there are.
 */
export const searchAll = async (
  text: string,
  size: number,
  { fetch: fetchFn = fetch, headers = {} }: {
    fetch?: typeof fetch;
    headers?: Record<string, string>;
  } = {},
): Promise<SearchResult> => {
  const objects: SearchObject[] = [];
  const seen = new Set<unknown>();
  let total = Infinity;
  let time: string | undefined;
  // Results npm has given, duplicates included, so the next page starts after
  let from = 0;

  while (objects.length < size && from < total) {
    const res = await fetchFn(
      searchUrl(text, Math.min(PAGE_SIZE, size - objects.length), from),
      { headers },
    ).catch(() => null);

    if (!res?.ok) {
      if (from === 0) throw new SearchError(res?.status ?? 502);

      break;
    }

    const page = await res.json().catch(() => null);
    const pageObjects: SearchObject[] = Array.isArray(page?.objects) ? page.objects : [];

    if (from === 0) {
      total = Number.isFinite(page?.total) ? page.total : pageObjects.length;
      time = page?.time;
    }

    // The index can shift between pages, so a package could come twice
    const fresh = pageObjects.filter((obj) => {
      const name = obj?.package?.name;

      if (seen.has(name)) return false;

      seen.add(name);

      return true;
    });

    if (!pageObjects.length) break;

    from += pageObjects.length;
    objects.push(...fresh);
  }

  return {
    objects,
    total: Number.isFinite(total) ? Math.max(total, objects.length) : objects.length,
    time,
  };
};
