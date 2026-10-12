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
function bad(msg: string, status = 400) {
  return json({ ok: false, error: msg }, status);
}

const NPM_REGISTRY = "https://registry.npmjs.org";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return bad("Method not allowed", 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Optional auth: accept missing bearer
  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");

  let packageName = "";
  try {
    const body = await req.json().catch(() => ({}));
    packageName = String(body?.packageName ?? "").trim();
  } catch {
    return bad("Invalid JSON body", 400);
  }

  if (!packageName) return bad("Missing packageName", 400);

  // If user is logged in, try to read active npm token (server-side)
  let npmToken: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await userClient.auth.getUser();

    if (!userErr && user) {
      // Fetch active token secret via RPC (will return null if none)
      const { data, error } = await userClient.rpc(
        "get_active_provider_token_secret",
        { p_provider: "npm" }
      );

      if (!error && typeof data === "string" && data.trim()) {
        npmToken = data.trim();
      }
    }
  }

  const url = `${NPM_REGISTRY}/${encodeURIComponent(packageName)}`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.npm.install-v1+json",
  };

  if (npmToken) {
    // npm registry auth format
    headers.Authorization = `Bearer ${npmToken}`;
  }

  const res = await fetch(url, { headers });

  // We only need existence; don’t stream body
  return json(
    {
      ok: true,
      exists: res.ok,
      status: res.status,
      authed: Boolean(npmToken), // handy for debugging; remove if you want
    },
    200
  );
});
