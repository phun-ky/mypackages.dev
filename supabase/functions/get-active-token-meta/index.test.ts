import { assertEquals } from "jsr:@std/assert@1";

import {
  captureErrors,
  databaseError,
  loadFunction,
  post,
  signedIn,
  stubFetch,
  SUPABASE_URL,
} from "../_shared/test-utils.ts";

const handler = await loadFunction("get-active-token-meta");

const RPC = `POST ${SUPABASE_URL}/rest/v1/rpc/get_active_provider_token_meta`;

Deno.test("get-active-token-meta: hides database errors", async () => {
  const fetch = stubFetch({ ...signedIn, [RPC]: databaseError });
  const errors = captureErrors();

  try {
    const res = await handler(post({ provider: "npm" }));
    const body = await res.text();

    assertEquals(res.status, 500);
    assertEquals(body.includes("relation"), false);
    assertEquals(errors.logged.length, 1);
  } finally {
    errors.restore();
    fetch.restore();
  }
});

Deno.test("get-active-token-meta: refuses an unknown provider with a 400", async () => {
  const fetch = stubFetch(signedIn);

  try {
    const res = await handler(post({ provider: "gitlab" }));

    assertEquals(res.status, 400);
    assertEquals(fetch.requests.includes(RPC), false);
  } finally {
    fetch.restore();
  }
});
