import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { isProvider, readBody, responses } from "../_shared/http.ts";

Deno.serve(async (req) => {
  const { json, preflight, failed } = responses(req);
  const bad = (msg: string, status = 400) => json({ error: msg }, status);

  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return bad("Method not allowed", 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return bad("Missing bearer token", 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return bad("Unauthorized", 401);

  const body = await readBody(req);
  const provider = body?.provider;
  if (!provider) return bad("Missing provider", 400);
  if (!isProvider(provider)) return bad("Invalid provider", 400);

  const { data, error } = await userClient.rpc("get_active_provider_token_meta", {
    p_provider: provider,
  });

  if (error) return failed("get_active_provider_token_meta", error);

  const row = Array.isArray(data) ? data[0] ?? null : data ?? null;

  return json({ ok: true, active: row }, 200);
});
