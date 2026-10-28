// CORS and answers for the functions the site calls (#29)

const SITE_ORIGIN = "https://mypackages.dev";
// The Vite dev server, allowed only where ALLOW_LOCAL_ORIGIN=true is set: in
// supabase/functions/.env for `supabase functions serve`, never in production
const LOCAL_ORIGIN = "http://localhost:5173";

const isAllowedOrigin = (origin: string) =>
  origin === SITE_ORIGIN ||
  (origin === LOCAL_ORIGIN && Deno.env.get("ALLOW_LOCAL_ORIGIN") === "true");

/**
 * CORS headers for the request: other origins get no
 * Access-Control-Allow-Origin, so browsers don't let their scripts read the
 * answer.
 */
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";

  return {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    // The answer depends on the origin, so caches must keep them apart
    Vary: "Origin",
    ...(isAllowedOrigin(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
  };
}

/** Answers for one request, with its CORS headers. */
export function responses(req: Request) {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders(req), "content-type": "application/json" },
    });

  return {
    json,
    preflight: () => new Response("ok", { headers: corsHeaders(req) }),
    /**
     * Logs the real error, and answers with a generic one: database and Vault
     * messages tell an attacker about the schema.
     */
    failed: (where: string, error: unknown, status = 500) => {
      console.error(`${where}:`, error);

      return json(
        { ok: false, error: "Something went wrong. Try again later." },
        status,
      );
    },
  };
}

/** The JSON body as an object, or null when it is missing or not an object. */
export async function readBody(
  req: Request,
): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();

    return body && typeof body === "object" && !Array.isArray(body)
      ? body
      : null;
  } catch {
    return null;
  }
}

export const PROVIDERS = ["npm", "github"] as const;
export type Provider = (typeof PROVIDERS)[number];

export const isProvider = (value: unknown): value is Provider =>
  PROVIDERS.includes(value as Provider);

export const isUuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
