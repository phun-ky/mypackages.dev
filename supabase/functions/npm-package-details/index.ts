import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { readBody, responses } from "../_shared/http.ts";

const NPM_REGISTRY = "https://registry.npmjs.org";

function parseRetryAfterSeconds(v: string | null): number | undefined {
  if (!v) return undefined;

  // "Retry-After: 120"
  const asNumber = Number(v);
  if (Number.isFinite(asNumber) && asNumber >= 0) return asNumber;

  // "Retry-After: Wed, 21 Oct 2015 07:28:00 GMT"
  const ms = Date.parse(v);
  if (!Number.isNaN(ms)) {
    const diff = Math.ceil((ms - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  }

  return undefined;
}

Deno.serve(async (req) => {
  const { json, preflight } = responses(req);
  const bad = (msg: string, status = 400, extra?: Record<string, unknown>) =>
    json({ ok: false, error: msg, ...extra }, status);

  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return bad("Method not allowed", 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");

  let name = "";
  const body = await readBody(req);
  if (!body) return bad("Invalid JSON body", 400);

  name = String(body.name ?? "").trim();

  if (!name) return bad("Missing name", 400);
  if (name.length > 214) return bad("Invalid package name", 400);

  let npmToken: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await userClient.auth.getUser();

    if (!userErr && user) {
      // With the service role, for the user verified above: signed-in users
      // can't read stored tokens themselves
      const admin = createClient(supabaseUrl, serviceRoleKey);
      const { data, error } = await admin.rpc(
        "get_provider_token_secret",
        { p_user_id: user.id, p_provider: "npm" }
      );

      if (!error && typeof data === "string" && data.trim()) {
        npmToken = data.trim();
      }
    }
  }

  const url = `${NPM_REGISTRY}/${encodeURIComponent(name)}`;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (npmToken) headers.Authorization = `Bearer ${npmToken}`;

  const res = await fetch(url, { headers });

  const retryAfterHeader = res.headers.get("retry-after");
  const retryAfterSeconds = parseRetryAfterSeconds(retryAfterHeader);

  if (!res.ok) {
    const body = await res.text().catch(() => undefined);

    // Special-case rate limiting
    if (res.status === 429) {
      // Return 200 to keep supabase.functions.invoke from surfacing `error`
      return bad("Rate limited by npm registry", 200, {
        kind: "rate_limited",
        status: 429,
        url,
        retryAfterSeconds,
        retryAfterHeader,
        authed: Boolean(npmToken),
      });
    }

    // Other upstream failures
    return bad(`Upstream error: ${res.status}`, 200, {
      kind: "upstream_error",
      status: res.status,
      url,
      body,
      retryAfterSeconds,
      retryAfterHeader,
      authed: Boolean(npmToken),
    });
  }

  const data = await res.json().catch(() => null);

  return json({ ok: true, data, authed: Boolean(npmToken) }, 200);
});
