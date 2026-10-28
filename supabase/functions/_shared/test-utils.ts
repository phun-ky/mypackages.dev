// Runs a function's handler without a server or a network: loadFunction
// imports its index.ts with Deno.serve replaced, and stubFetch plays Supabase
// and npm

export const SUPABASE_URL = "http://supabase.test";
export const SITE_ORIGIN = "https://mypackages.dev";

type Handler = (req: Request) => Response | Promise<Response>;

// A module runs once, so its handler is kept for the next test
const loaded = new Map<string, Handler>();

/** The handler a function passes to Deno.serve. */
export async function loadFunction(name: string): Promise<Handler> {
  const cached = loaded.get(name);

  if (cached) return cached;

  Deno.env.set("SUPABASE_URL", SUPABASE_URL);
  Deno.env.set("SUPABASE_ANON_KEY", "anon-key");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");

  const deno = Deno as unknown as { serve: unknown };
  const serve = deno.serve;
  let handler: Handler | undefined;

  deno.serve = (h: Handler) => {
    handler = h;
  };

  try {
    await import(new URL(`../${name}/index.ts`, import.meta.url).href);
  } finally {
    deno.serve = serve;
  }

  if (!handler) throw new Error(`${name} didn't call Deno.serve`);

  loaded.set(name, handler);

  return handler;
}

type Route = (req: Request) => Response | Promise<Response>;

/**
 * Answers fetch by "METHOD url" (without the query), and 404 for anything
 * else. Returns the requests made, and a restore function.
 */
export function stubFetch(routes: Record<string, Route>) {
  const original = globalThis.fetch;
  const requests: string[] = [];

  globalThis.fetch = (input: string | URL | Request, init?: RequestInit) => {
    const req = new Request(input, init);
    const url = new URL(req.url);
    const key = `${req.method} ${url.origin}${url.pathname}`;

    requests.push(key);

    return Promise.resolve(
      routes[key]?.(req) ?? new Response("not stubbed", { status: 404 }),
    );
  };

  return {
    requests,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

/** What the function logs with console.error, kept off the test output. */
export function captureErrors() {
  const original = console.error;
  const logged: string[] = [];

  console.error = (...args: unknown[]) => {
    logged.push(args.map((a) => JSON.stringify(a) ?? String(a)).join(" "));
  };

  return {
    logged,
    restore: () => {
      console.error = original;
    },
  };
}

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

/** Supabase Auth answering for a signed-in user. */
export const signedIn = {
  [`GET ${SUPABASE_URL}/auth/v1/user`]: () =>
    jsonResponse({
      id: "00000000-0000-4000-8000-000000000001",
      aud: "authenticated",
      role: "authenticated",
    }),
};

/** A PostgREST error, as Postgres or Vault would give it. */
export const databaseError = () =>
  jsonResponse(
    {
      code: "42P01",
      message: 'relation "vault.secrets_internal" does not exist',
      details: null,
      hint: null,
    },
    400,
  );

/** A request from the site, signed in. */
export const post = (body: unknown, origin = SITE_ORIGIN) =>
  new Request("http://functions.test", {
    method: "POST",
    headers: {
      authorization: "Bearer user-jwt",
      "content-type": "application/json",
      origin,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
