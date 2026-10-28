import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";

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

const handler = await loadFunction("save-secret");

const VAULT = `POST ${SUPABASE_URL}/rest/v1/rpc/create_vault_secret`;
const UPSERT = `POST ${SUPABASE_URL}/rest/v1/user_provider_tokens`;
const valid = { provider: "npm", label: null, token: "npm_abc123", meta: {} };

Deno.test("save-secret: hides Vault errors", async () => {
  const fetch = stubFetch({ ...signedIn, [VAULT]: databaseError });
  const errors = captureErrors();

  try {
    const res = await handler(post(valid));
    const body = await res.text();

    assertEquals(res.status, 500);
    assertEquals(JSON.parse(body), {
      ok: false,
      error: "Something went wrong. Try again later.",
    });
    assertEquals(body.includes("vault"), false);
    assertStringIncludes(errors.logged.join("\n"), "secrets_internal");
  } finally {
    errors.restore();
    fetch.restore();
  }
});

Deno.test("save-secret: hides database errors", async () => {
  const fetch = stubFetch({
    ...signedIn,
    [VAULT]: () => jsonResponse("00000000-0000-4000-8000-0000000000a1"),
    [UPSERT]: databaseError,
  });
  const errors = captureErrors();

  try {
    const res = await handler(post(valid));
    const body = await res.text();

    assertEquals(res.status, 500);
    assertEquals(body.includes("relation"), false);
  } finally {
    errors.restore();
    fetch.restore();
  }
});

for (
  const [what, body] of [
    ["invalid JSON", "{"],
    ["a body that isn't an object", [valid]],
    ["an unknown provider", { ...valid, provider: "gitlab" }],
    ["a label that isn't text", { ...valid, label: 42 }],
    ["a label over 64 characters", { ...valid, label: "a".repeat(65) }],
    ["an empty token", { ...valid, token: " " }],
    ["a token over 512 characters", { ...valid, token: "a".repeat(513) }],
    ["a token with spaces", { ...valid, token: "npm_abc 123" }],
    ["meta that isn't an object", { ...valid, meta: ["a"] }],
    ["meta over 1 kB", { ...valid, meta: { a: "a".repeat(1024) } }],
  ] as const
) {
  Deno.test(`save-secret: refuses ${what} with a 400`, async () => {
    const fetch = stubFetch(signedIn);

    try {
      const res = await handler(post(body));

      assertEquals(res.status, 400);
      assertEquals(typeof (await res.json()).error, "string");
      assertEquals(fetch.requests.includes(VAULT), false);
    } finally {
      fetch.restore();
    }
  });
}
