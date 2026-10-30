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

const handler = await loadFunction("delete-secret");

const RPC = `POST ${SUPABASE_URL}/rest/v1/rpc/delete_provider_token`;
const TOKEN_ID = "00000000-0000-4000-8000-0000000000a1";

Deno.test("delete-secret: deletes the user's token", async () => {
  const fetch = stubFetch({ ...signedIn, [RPC]: () => jsonResponse(null, 200) });

  try {
    const res = await handler(post({ token_id: TOKEN_ID }));

    assertEquals(res.status, 200);
    assertEquals(await res.json(), { ok: true });
    assertEquals(fetch.requests.includes(RPC), true);
  } finally {
    fetch.restore();
  }
});

// Another user's token: the database function raises, and the reason stays
// in the logs
Deno.test("delete-secret: hides the database's reason", async () => {
  const fetch = stubFetch({
    ...signedIn,
    [RPC]: () =>
      jsonResponse({ code: "P0001", message: "token not found for user" }, 400),
  });
  const errors = captureErrors();

  try {
    const res = await handler(post({ token_id: TOKEN_ID }));
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
    ["a missing token id", {}],
    ["a token id that isn't a UUID", { token_id: "1 or 1=1" }],
  ] as const
) {
  Deno.test(`delete-secret: refuses ${what} with a 400`, async () => {
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

Deno.test("delete-secret: refuses without a session", async () => {
  const fetch = stubFetch({});

  try {
    const res = await handler(
      new Request("http://functions.test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token_id: TOKEN_ID }),
      }),
    );

    assertEquals(res.status, 401);
    assertEquals(fetch.requests.includes(RPC), false);
  } finally {
    fetch.restore();
  }
});
