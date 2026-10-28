import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { isProvider, isUuid, readBody, responses } from "../_shared/http.ts";

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
  const tokenId = body?.token_id;

  if (!provider) return bad("Missing provider", 400);
  if (!isProvider(provider)) return bad("Invalid provider", 400);
  if (!tokenId) return bad("Missing token_id", 400);
  if (!isUuid(tokenId)) return bad("Invalid token_id", 400);

  const { error } = await userClient.rpc("set_active_provider_token", {
    p_provider: provider,
    p_token_id: tokenId,
  });

  // The function raises for a token that isn't the user's
  if (error) return failed("set_active_provider_token", error, 400);

  return json({ ok: true }, 200);
});
