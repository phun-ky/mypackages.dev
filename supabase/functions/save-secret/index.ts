import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Provider = "npm" | "github";

type Body = {
  provider: Provider;
  label: string | null;
  token: string;
  meta: Record<string, unknown>;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // set to your domain in prod
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
  return json({ error: msg }, status);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

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

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return bad("Invalid JSON body", 400);
  }

  const provider = body.provider;
  const label = body.label ?? null;
  const token = (body.token ?? "").trim();
  const meta = body.meta ?? {};

  if (!provider || !["npm", "github"].includes(provider))
    return bad("Invalid provider", 400);

  if (!token) return bad("Token cannot be empty", 400);

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

  if (vaultErr) return bad(`Vault error: ${vaultErr.message}`, 500);

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

if (upsertErr) return bad(`DB error: ${upsertErr.message}`, 500);

return json({ ok: true, token: row }, 200);

});
