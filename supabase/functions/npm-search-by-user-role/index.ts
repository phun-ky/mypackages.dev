import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { readBody, responses } from "../_shared/http.ts";

const NPM_REGISTRY = "https://registry.npmjs.org";

const clampSize = (n: unknown) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return 50;
  // npm allows up to 250; you also enforce max 250 in your UI
  return Math.max(1, Math.min(250, Math.floor(x)));
};

Deno.serve(async (req) => {
  const { json, preflight } = responses(req);
  const bad = (msg: string, status = 400) =>
    json({ ok: false, error: msg }, status);

  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return bad("Method not allowed", 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Optional auth
  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");

  let username = "";
  let size = 50;

  const body = await readBody(req);
  if (!body) return bad("Invalid JSON body", 400);

  username = String(body.username ?? "").trim();
  size = clampSize(body.size);

  if (!username) return bad("Missing username", 400);
  if (username.length > 320) return bad("Username too long", 400);

  // If logged in, try to get active npm token
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

  // Maintainers only: npm's `author:` matches whoever published the latest
  // version, which trusted publishing records as GitHub Actions (#95). A
  // `mode` from pages loaded before that is ignored
  const query = `maintainer:${username}`;

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
