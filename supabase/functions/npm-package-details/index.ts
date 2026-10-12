import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}
function bad(
  msg: string,
  status = 400,
  extra?: Record<string, unknown>
) {
  return json({ ok: false, error: msg, ...extra }, status);
}

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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return bad("Method not allowed", 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");

  let name = "";
  try {
    const body = await req.json().catch(() => ({}));
    name = String(body?.name ?? "").trim();
  } catch {
    return bad("Invalid JSON body", 400);
  }

  if (!name) return bad("Missing name", 400);
  if (name.length > 214) return bad("Invalid package name", 400);

  let npmToken: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await userClient.auth.getUser();

    if (!userErr && user) {
      const { data, error } = await userClient.rpc(
        "get_active_provider_token_secret",
        { p_provider: "npm" }
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
