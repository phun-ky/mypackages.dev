import { assertEquals } from "jsr:@std/assert@1";

import { loadFunction, SITE_ORIGIN } from "./test-utils.ts";

// Every function the site calls; portfolio-snapshot is called by a cron job
const FUNCTIONS = [
  "delete-secret",
  "ensure_package",
  "get-active-token-meta",
  "list-secrets",
  "npm-downloads-last-month",
  "npm-downloads-last-year",
  "npm-exists-package",
  "npm-package-details",
  "npm-search-by-user-role",
  "npm-user-has-packages",
  "save-secret",
  "set-active-token",
];

const preflight = (origin: string) =>
  new Request("http://functions.test", {
    method: "OPTIONS",
    headers: {
      origin,
      "access-control-request-method": "POST",
      "access-control-request-headers": "authorization, content-type",
    },
  });

for (const name of FUNCTIONS) {
  Deno.test(`${name}: allows the site, and no other origin`, async () => {
    const handler = await loadFunction(name);

    const site = await handler(preflight(SITE_ORIGIN));

    assertEquals(site.status, 200);
    assertEquals(site.headers.get("access-control-allow-origin"), SITE_ORIGIN);
    assertEquals(site.headers.get("vary"), "Origin");

    for (const origin of ["https://example.com", "http://localhost:5173"]) {
      const other = await handler(preflight(origin));

      assertEquals(
        other.headers.get("access-control-allow-origin"),
        null,
        origin,
      );
      assertEquals(other.headers.get("vary"), "Origin");
    }

    // Answers other than preflights carry the headers too
    const notAllowed = await handler(
      new Request("http://functions.test", {
        method: "GET",
        headers: { origin: SITE_ORIGIN },
      }),
    );

    assertEquals(notAllowed.status, 405);
    assertEquals(
      notAllowed.headers.get("access-control-allow-origin"),
      SITE_ORIGIN,
    );
  });
}

Deno.test("allows the Vite dev server only with ALLOW_LOCAL_ORIGIN", async () => {
  const handler = await loadFunction("npm-package-details");

  Deno.env.set("ALLOW_LOCAL_ORIGIN", "true");

  try {
    const local = await handler(preflight("http://localhost:5173"));

    assertEquals(
      local.headers.get("access-control-allow-origin"),
      "http://localhost:5173",
    );
  } finally {
    Deno.env.delete("ALLOW_LOCAL_ORIGIN");
  }
});
