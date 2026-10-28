import { assertEquals } from "jsr:@std/assert@1";

import {
  captureErrors,
  databaseError,
  jsonResponse,
  loadFunction,
  post,
  signedIn,
  stubFetch,
  SUPABASE_URL,
} from "../_shared/test-utils.ts";

const handler = await loadFunction("ensure_package");

const NPM = "GET https://registry.npmjs.org/%40phun-ky%2Fspeccer";
const INSERT = `POST ${SUPABASE_URL}/rest/v1/ensured_packages`;

Deno.test("ensure_package: hides database errors", async () => {
  const fetch = stubFetch({
    ...signedIn,
    [NPM]: () => jsonResponse({}),
    [INSERT]: databaseError,
  });
  const errors = captureErrors();

  try {
    const res = await handler(post({ packageName: "@phun-ky/speccer" }));
    const body = await res.text();

    assertEquals(res.status, 500);
    assertEquals(body.includes("relation"), false);
    assertEquals(errors.logged.length, 1);
  } finally {
    errors.restore();
    fetch.restore();
  }
});

Deno.test("ensure_package: asks npm only for a signed-in user", async () => {
  const fetch = stubFetch({
    [`GET ${SUPABASE_URL}/auth/v1/user`]: () =>
      jsonResponse({ message: "invalid JWT" }, 401),
  });

  try {
    const res = await handler(post({ packageName: "@phun-ky/speccer" }));

    assertEquals(res.status, 401);
    assertEquals(fetch.requests.includes(NPM), false);
  } finally {
    fetch.restore();
  }
});

for (
  const [what, packageName] of [
    ["markup", '<img src=x onerror="alert(1)">'],
    ["a path", "../../-/user/org.couchdb.user:someone"],
    ["a name over 214 characters", "a".repeat(215)],
  ] as const
) {
  Deno.test(`ensure_package: refuses ${what} with a 400`, async () => {
    const fetch = stubFetch(signedIn);

    try {
      const res = await handler(post({ packageName }));

      assertEquals(res.status, 400);
      assertEquals(fetch.requests.some((r) => r.includes("npmjs")), false);
    } finally {
      fetch.restore();
    }
  });
}
