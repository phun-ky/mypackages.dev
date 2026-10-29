import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { readBody, responses } from "../_shared/http.ts";

const NPM_REGISTRY = "https://registry.npmjs.org";

Deno.serve(async (req) => {
  const { json, preflight } = responses(req);
  const bad = (msg: string, status = 400) =>
    json({ ok: false, error: msg }, status);

  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return bad("Method not allowed", 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Optional auth
  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");

  let username = "";

  const body = await readBody(req);
  if (!body) return bad("Invalid JSON body", 400);

  username = String(body.username ?? "").trim();

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

  // Maintainers only (#95); a `mode` from pages loaded before that is ignored
  const query = `maintainer:${username}`;

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
