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
  return json({ error: msg }, status);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
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

  const body = await req.json().catch(() => ({}));
  const provider = String(body?.provider ?? "").trim();
  const tokenId = String(body?.token_id ?? "").trim();

  if (!provider) return bad("Missing provider", 400);
  if (!tokenId) return bad("Missing token_id", 400);

  const { error } = await userClient.rpc("set_active_provider_token", {
    p_provider: provider,
    p_token_id: tokenId,
  });

  if (error) return bad(error.message, 400);

  return json({ ok: true }, 200);
});
