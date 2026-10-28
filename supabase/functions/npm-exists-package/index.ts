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

  // Optional auth: accept missing bearer
  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");

  let packageName = "";
  const body = await readBody(req);
  if (!body) return bad("Invalid JSON body", 400);

  packageName = String(body.packageName ?? "").trim();

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
