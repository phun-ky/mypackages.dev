import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Mode = "maintainer" | "author";

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

const isValidEmail = (s: string) => {
  const v = (s ?? "").trim();
  if (!v) return false;
  if (v.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
};

const clampSize = (n: unknown) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return 50;
  // npm allows up to 250; you also enforce max 250 in your UI
  return Math.max(1, Math.min(250, Math.floor(x)));
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return bad("Method not allowed", 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Optional auth
  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");

  let username = "";
  let mode: Mode | null = null;
  let size = 50;

  try {
    const body = await req.json().catch(() => ({}));
    username = String(body?.username ?? "").trim();
    mode = (body?.mode ?? null) as Mode | null;
    size = clampSize(body?.size);
  } catch {
    return bad("Invalid JSON body", 400);
  }

  if (!username) return bad("Missing username", 400);
  if (username.length > 320) return bad("Username too long", 400);
  if (mode !== "maintainer" && mode !== "author") return bad("Invalid mode", 400);

  // If logged in, try to get active npm token
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

  // Build query safely server-side
  const query =
    mode === "author" && isValidEmail(username)
      ? `author.email:${username}`
      : `${mode}:${username}`;

  const searchUrl =
    `${NPM_REGISTRY}/-/v1/search?text=` +
    encodeURIComponent(query) +
    `&size=${size}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (npmToken) headers.Authorization = `Bearer ${npmToken}`;

  const res = await fetch(searchUrl, { headers });

  if (!res.ok) {
    return bad(`Search failed: ${res.status}`, 502);
  }

  const data = await res.json().catch(() => null);

  return json(
    {
      ok: true,
      data,
      authed: Boolean(npmToken), 
    },
    200
  );
});
