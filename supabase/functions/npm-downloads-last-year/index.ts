import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { readBody, responses } from "../_shared/http.ts";

const NPM_REGISTRY_API = "https://api.npmjs.org";

Deno.serve(async (req) => {
  const { json, preflight } = responses(req);
  const bad = (msg: string, status = 400, extra?: Record<string, unknown>) =>
    json({ ok: false, error: msg, ...extra }, status);

  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return bad("Method not allowed", 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Optional auth
  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");

  let name = "";
  const body = await readBody(req);
  if (!body) return bad("Invalid JSON body", 400);

  name = String(body.name ?? "").trim();

  if (!name) return bad("Missing name", 400);
  if (name.length > 214) return bad("Invalid package name", 400); // npm max is 214

  // Optional: if logged in, fetch active npm token
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

  const url =
    `${NPM_REGISTRY_API}/downloads/range/last-year/` +
    encodeURIComponent(name);

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (npmToken) headers.Authorization = `Bearer ${npmToken}`;

  const res = await fetch(url, { headers });

  // Forward retry-after if present (you use it)
  const retryAfter = res.headers.get("retry-after");
  const retryAfterSeconds = retryAfter ? Number(retryAfter) : undefined;

  if (!res.ok) {
    const body = await res.text().catch(() => undefined);

    // Keep response structured so client can re-create HttpError cleanly
    return bad(`Upstream error: ${res.status}`, 502, {
      status: res.status,
      url,
      body,
      retryAfterSeconds: Number.isFinite(retryAfterSeconds)
        ? retryAfterSeconds
        : undefined,
    });
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
