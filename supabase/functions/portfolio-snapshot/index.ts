// Computes the example portfolio on the front page once a day, and stores it
// in public.portfolio_snapshots, so visitors read one row instead of making
// about 73 npm requests each (#67). Called by the `portfolio-snapshot` cron
// job (see the migration), with a shared secret.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { computeSnapshot, type DailyDownloads, type PackageInput } from "./compute.ts";

// The portfolios to compute: the example on the front page
const PORTFOLIOS = [{ username: "phun-ky", role: "maintainer" }] as const;

const NPM_REGISTRY = "https://registry.npmjs.org";
const NPM_API = "https://api.npmjs.org";
// As the site asks for (Config.responseSize); npm allows up to 250
const SEARCH_SIZE = 250;
// Gentle on npm's rate limits: a few requests at a time, one retry on 429
const CONCURRENCY = 3;
const MAX_RETRY_AFTER_SECONDS = 30;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// Compares in constant time, so the secret can't be guessed from timings
function sameSecret(a: string, b: string) {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;

  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  }

  return diff === 0;
}

async function getJson(url: string): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { Accept: "application/json" } });

    if (res.status === 429 && attempt === 0) {
      const wait = Math.min(Number(res.headers.get("retry-after")) || 5, MAX_RETRY_AFTER_SECONDS);

      await res.body?.cancel();
      await new Promise((resolve) => setTimeout(resolve, wait * 1000));
      continue;
    }

    if (!res.ok) {
      await res.body?.cancel();
      throw new Error(`${res.status} from ${url}`);
    }

    return await res.json();
  }
}

type SearchObject = { package?: { name?: unknown }; downloads?: { monthly?: unknown } };

async function searchPackages(username: string, role: string) {
  const query = encodeURIComponent(`${role}:${username}`);
  const data = await getJson(`${NPM_REGISTRY}/-/v1/search?text=${query}&size=${SEARCH_SIZE}`);
  const objects = (data as { objects?: unknown })?.objects;

  if (!Array.isArray(objects)) throw new TypeError("npm search returned no objects");

  return (objects as SearchObject[]).flatMap((object) => {
    const name = object.package?.name;
    const monthly = Number(object.downloads?.monthly);

    return typeof name === "string" && name
      ? [{ name, monthly: Number.isFinite(monthly) && monthly > 0 ? monthly : 0 }]
      : [];
  });
}

async function lastYearDownloads(name: string): Promise<DailyDownloads[]> {
  const data = await getJson(
    `${NPM_API}/downloads/range/last-year/${encodeURIComponent(name)}`,
  );
  const downloads = (data as { downloads?: unknown })?.downloads;

  if (!Array.isArray(downloads)) return [];

  return downloads.filter(
    (d): d is DailyDownloads => typeof d?.day === "string" && Number.isFinite(d?.downloads),
  );
}

async function mapConcurrently<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;

      results[index] = await fn(items[index]);
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));

  return results;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const secret = Deno.env.get("PORTFOLIO_SNAPSHOT_SECRET");

  if (!secret) {
    console.error("PORTFOLIO_SNAPSHOT_SECRET is not set");

    return json({ error: "Not configured" }, 500);
  }

  if (!sameSecret(req.headers.get("x-snapshot-secret") ?? "", secret)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const results = [];

  for (const { username, role } of PORTFOLIOS) {
    try {
      const found = await searchPackages(username, role);
      const packages: PackageInput[] = await mapConcurrently(found, CONCURRENCY, async (pkg) => ({
        ...pkg,
        daily: await lastYearDownloads(pkg.name),
      }));
      const snapshot = computeSnapshot(packages, new Date());
      const { error } = await admin
        .from("portfolio_snapshots")
        .upsert({ username, role, computed_at: new Date().toISOString(), ...snapshot });

      if (error) throw new Error(error.message);

      results.push({ username, ok: true, packages: snapshot.package_count });
    } catch (error) {
      // Keep the previous snapshot; the front page shows when it's from
      console.error(`portfolio-snapshot for ${username} failed:`, error);
      results.push({ username, ok: false });
    }
  }

  return json({ results }, results.every((r) => r.ok) ? 200 : 502);
});
