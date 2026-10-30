import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { isUuid, readBody, responses } from "../_shared/http.ts";

// Deletes one of the signed-in user's stored tokens, and its secret in Vault
// (#125). The database function deletes only the caller's own token, and a
// trigger deletes the Vault secret with the row.
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
  const tokenId = body?.token_id;

  if (!tokenId) return bad("Missing token_id", 400);
  if (!isUuid(tokenId)) return bad("Invalid token_id", 400);

  const { error } = await userClient.rpc("delete_provider_token", {
    p_token_id: tokenId,
  });

  // The function raises for a token that isn't the user's
  if (error) return failed("delete_provider_token", error, 400);

  return json({ ok: true }, 200);
});
