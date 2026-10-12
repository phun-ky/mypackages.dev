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

function bad(message: string, status = 400) {
  return json({ ok: false, error: message }, status);
}

const normalizePackageName = (raw: string) =>
  raw.trim().replace(/\s+/g, "").toLowerCase();

const NPM_REGISTRY = "https://registry.npmjs.org";

async function existsNpmPackage(packageName: string, signal?: AbortSignal) {
  const url = `${NPM_REGISTRY}/${encodeURIComponent(packageName)}`;
  const res = await fetch(url, { signal });
  return res.ok; // 200
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return bad("Method not allowed", 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return bad("Missing Authorization header", 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // IMPORTANT: use anon + pass user JWT so RLS applies
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    packageName: rawPackageName,
    registry = "npm",
  } = await req.json().catch(() => ({} as any));

  if (registry !== "npm") {
    // ready for github later
    return bad("Only registry='npm' is supported right now", 400);
  }

  const packageName = normalizePackageName(String(rawPackageName ?? ""));
  if (!packageName) return bad("Package name is required", 400);

  // basic sanity; keep permissive for scoped packages
  // (If you already have stricter validation elsewhere, reuse it.)
  if (packageName.length < 2) return bad("Package name looks too short", 400);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  let exists = false;
  try {
    exists = await existsNpmPackage(packageName, controller.signal);
  } catch {
    clearTimeout(timeout);
    return bad("Could not verify package right now. Try again.", 502);
  } finally {
    clearTimeout(timeout);
  }

  if (!exists) {
    return json({
      ok: false,
      code: "NOT_FOUND",
      message: "Package not found in npm registry (typo?)",
      packageName,
      registry,
    }, 200);
  }

  // Identify user (we need user_id for RLS)
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return bad("Unauthorized", 401);

  const user_id = userData.user.id;

  // Insert. If it exists already, return a warning response.
  const { data, error } = await supabase
    .from("ensured_packages")
    .insert({ user_id, registry, package_name: packageName })
    .select("*")
    .single();

  if (error) {
    // Postgres unique violation
    // supabase-js typically exposes error.code as string
    if ((error as any).code === "23505") {
      return json({
        ok: true,
        code: "ALREADY_EXISTS",
        message: "Package is already registered",
        packageName,
        registry,
      }, 200);
    }

    return json({ ok: false, error: error.message }, 500);
  }

  return json({
    ok: true,
    code: "INSERTED",
    message: "Registered",
    row: data,
  });
});
