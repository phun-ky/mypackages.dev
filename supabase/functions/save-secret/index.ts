import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { isProvider, readBody, responses } from "../_shared/http.ts";

// Room for any npm or GitHub token, and a short label; the form has the same
// limits
const MAX_LABEL_LENGTH = 64;
const MAX_TOKEN_LENGTH = 512;
// The site sends only when the token was entered
const MAX_META_LENGTH = 1024;

Deno.serve(async (req) => {
  const { json, preflight, failed } = responses(req);
  const bad = (msg: string, status = 400) => json({ error: msg }, status);

  if (req.method === "OPTIONS") return preflight();

  if (req.method !== "POST") return bad("Method not allowed", 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Handle both header casings
  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return bad("Missing bearer token", 401);
  }

  // Verify user inside function
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return bad("Unauthorized", 401);

  const body = await readBody(req);
  if (!body) return bad("Invalid JSON body", 400);

  const provider = body.provider;
  const label = typeof body.label === "string" ? body.label : null;
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const meta = body.meta ?? {};

  if (!isProvider(provider)) return bad("Invalid provider", 400);

  if (body.label != null && typeof body.label !== "string") {
    return bad("Invalid label", 400);
  }
  if (label !== null && label.length > MAX_LABEL_LENGTH) {
    return bad(`Label can be at most ${MAX_LABEL_LENGTH} characters`, 400);
  }

  if (!token) return bad("Token cannot be empty", 400);
  if (token.length > MAX_TOKEN_LENGTH || /\s/.test(token)) {
    return bad("Invalid token", 400);
  }

  if (typeof meta !== "object" || meta === null || Array.isArray(meta)) {
    return bad("Invalid meta", 400);
  }
  if (JSON.stringify(meta).length > MAX_META_LENGTH) {
    return bad("Meta is too large", 400);
  }

  // Service role for DB writes
  const admin = createClient(supabaseUrl, serviceRoleKey);

  // ✅ Create secret via public SECURITY DEFINER wrapper (NOT vault schema directly)
  const { data: secretData, error: vaultErr } = await admin.rpc(
    "create_vault_secret",
    {
      p_name: `pat:${provider}:${user.id}:${label ?? "default"}`,
      p_secret: token,
      p_description: `User PAT for provider=${provider}, user=${user.id}, label=${label ?? "default"}`,
    }
  );

  if (vaultErr) return failed("save-secret create_vault_secret", vaultErr);

  const vault_secret_id = secretData as string;

  const { data: row, error: upsertErr } = await admin
  .from("user_provider_tokens")
  .upsert(
    {
      user_id: user.id,
      provider,
      label,
      vault_secret_id,
      meta,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider,label" }
  )
  .select("id, provider, label, updated_at")
  .single();

if (upsertErr) return failed("save-secret upsert", upsertErr);

return json({ ok: true, token: row }, 200);

});
