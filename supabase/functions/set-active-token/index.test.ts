import { assertEquals } from "jsr:@std/assert@1";

import {
  captureErrors,
  jsonResponse,
  loadFunction,
  post,
  signedIn,
  stubFetch,
  SUPABASE_URL,
} from "../_shared/test-utils.ts";

const handler = await loadFunction("set-active-token");

const RPC = `POST ${SUPABASE_URL}/rest/v1/rpc/set_active_provider_token`;
const TOKEN_ID = "00000000-0000-4000-8000-0000000000a1";

Deno.test("set-active-token: hides the database's reason", async () => {
  const fetch = stubFetch({
    ...signedIn,
    [RPC]: () =>
      jsonResponse(
        { code: "P0001", message: "token not found for user/provider" },
        400,
      ),
  });
  const errors = captureErrors();

  try {
    const res = await handler(post({ provider: "npm", token_id: TOKEN_ID }));
    const body = await res.text();

    assertEquals(res.status, 400);
    assertEquals(body.includes("token not found"), false);
    assertEquals(errors.logged.length, 1);
  } finally {
    errors.restore();
    fetch.restore();
  }
});

for (
  const [what, body] of [
    ["a missing provider", { token_id: TOKEN_ID }],
    ["an unknown provider", { provider: "gitlab", token_id: TOKEN_ID }],
    ["a missing token id", { provider: "npm" }],
    ["a token id that isn't a UUID", { provider: "npm", token_id: "1 or 1=1" }],
  ] as const
) {
  Deno.test(`set-active-token: refuses ${what} with a 400`, async () => {
    const fetch = stubFetch(signedIn);

    try {
      const res = await handler(post(body));

      assertEquals(res.status, 400);
      assertEquals(fetch.requests.includes(RPC), false);
    } finally {
      fetch.restore();
    }
  });
}
