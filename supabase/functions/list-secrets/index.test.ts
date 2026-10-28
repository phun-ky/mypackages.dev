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

const handler = await loadFunction("list-secrets");

Deno.test("list-secrets: hides database errors", async () => {
  const fetch = stubFetch({
    ...signedIn,
    [`GET ${SUPABASE_URL}/rest/v1/user_provider_tokens`]: databaseError,
  });
  const errors = captureErrors();

  try {
    const res = await handler(post({}));
    const body = await res.text();

    assertEquals(res.status, 500);
    assertEquals(JSON.parse(body), {
      ok: false,
      error: "Something went wrong. Try again later.",
    });
    assertEquals(errors.logged.length, 1);
  } finally {
    errors.restore();
    fetch.restore();
  }
});

Deno.test("list-secrets: refuses a request without a user", async () => {
  const fetch = stubFetch({});

  try {
    const res = await handler(
      new Request("http://functions.test", { method: "POST" }),
    );

    assertEquals(res.status, 401);
  } finally {
    fetch.restore();
  }
});
