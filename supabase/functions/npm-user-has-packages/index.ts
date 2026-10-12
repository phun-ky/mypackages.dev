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

type Mode = "maintainer" | "author";

const isValidEmail = (s: string) => {
  // simple + safe; you already have one client-side, but we need server-side too
  const v = (s ?? "").trim();
  if (!v) return false;
  if (v.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return bad("Method not allowed", 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Optional auth
  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");

  let mode: Mode | null = null;
  let username = "";

  try {
    const body = await req.json().catch(() => ({}));
    mode = (body?.mode ?? null) as Mode | null;
    username = String(body?.username ?? "").trim();
  } catch {
    return bad("Invalid JSON body", 400);
  }

  if (mode !== "maintainer" && mode !== "author") return bad("Invalid mode", 400);
  if (!username) return bad("Missing username", 400);
  if (username.length > 320) return bad("Username too long", 400);

  // If user is logged in, try to read active npm token
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

  // Build query server-side (no arbitrary passthrough)
  const query =
    mode === "maintainer"
      ? `maintainer:${username}`
      : isValidEmail(username)
        ? `author.email:${username}`
        : `author:${username}`;

  const url =
    `${NPM_REGISTRY}/-/v1/search?text=` +
    encodeURIComponent(query) +
    `&size=1`;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (npmToken) headers.Authorization = `Bearer ${npmToken}`;

  const res = await fetch(url, { headers });

  if (!res.ok) {
    // don’t leak upstream text
    return json(
      { ok: true, hasPackages: false, status: res.status },
      200
    );
  }

  const data = (await res.json().catch(() => ({}))) as { total?: number };

  return json(
    {
      ok: true,
      hasPackages: (data.total ?? 0) > 0,
      total: data.total ?? 0,
      status: res.status,
      authed: Boolean(npmToken), // optional; remove later
    },
    200
  );
});
