// Computes the example portfolio on the front page once a day, and stores it
// in public.portfolio_snapshots, so visitors read one row instead of making
// about 73 npm requests each (#67). Called by the `portfolio-snapshot` cron
// job (see the migrations), with a shared secret.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { completeMonthsRange } from "../_shared/download-range.ts";
import { computeSnapshot } from "./compute.ts";
import { createNpmClient } from "./npm.ts";

// The portfolios to compute: the example on the front page
const PORTFOLIOS = [{ username: "phun-ky", role: "maintainer" }] as const;

// Under the function's time limit and the cron job's 120 s timeout, with
// room to write the result (#69)
const BUDGET_MS = 100_000;

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
  const npm = createNpmClient({ deadline: Date.now() + BUDGET_MS });
  const results = [];

  for (const { username, role } of PORTFOLIOS) {
    try {
      const names = await npm.searchPackages(username, role);
      const daily = await npm.dailyDownloads(names, completeMonthsRange(new Date()));
      const snapshot = computeSnapshot(
        names.map((name) => ({ name, daily: daily.get(name) ?? [] })),
      );
      const { error } = await admin
        .from("portfolio_snapshots")
        .upsert({ username, role, computed_at: new Date().toISOString(), ...snapshot });

      if (error) throw new Error(error.message);

      results.push({ username, ok: true, packages: snapshot.package_count });
    } catch (error) {
      // Keep the previous snapshot; the front page shows when it's from. The
      // reason goes in the answer too, which only a caller with the secret
      // sees, so the cron job's net._http_response row shows it.
      const reason = String((error as Error)?.message ?? error).slice(0, 300);

      console.error(`portfolio-snapshot for ${username} failed:`, error);
      results.push({ username, ok: false, error: reason });
    }
  }

  return json({ results }, results.every((r) => r.ok) ? 200 : 502);
});
