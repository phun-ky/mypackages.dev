import { assertEquals, assertRejects } from "jsr:@std/assert@1";

import { createNpmClient, retryAfterMs } from "./npm.ts";

// Plays npm: answers each request with the next response for its URL, and
// keeps a fake clock that only moves when the client sleeps
const fakeNpm = (responses: Record<string, Array<() => Response>>) => {
  let clock = 0;
  const requests: string[] = [];
  const waits: number[] = [];

  return {
    requests,
    waits,
    options: {
      fetch: (input: string | URL | Request) => {
        const url = String(input);
        const next = responses[url]?.shift();

        requests.push(url);

        return Promise.resolve(next ? next() : new Response("not found", { status: 404 }));
      },
      sleep: (ms: number) => {
        waits.push(ms);
        clock += ms;

        return Promise.resolve();
      },
      now: () => clock,
    },
  };
};

const ok = (body: unknown) => () => Response.json(body);
const limited = (retryAfter?: string) => () =>
  new Response("slow down", {
    status: 429,
    headers: retryAfter ? { "retry-after": retryAfter } : {},
  });
const days = [{ day: "2026-09-01", downloads: 5 }];
const YEAR = { start: "2025-10-01", end: "2026-09-30" };
const range = (name: string, path = "2025-10-01:2026-09-30") =>
  `https://api.npmjs.org/downloads/range/${path}/${name}`;

Deno.test("retryAfterMs reads seconds and HTTP dates", () => {
  assertEquals(retryAfterMs("12", 0), 12_000);
  assertEquals(retryAfterMs(new Date(5_000).toUTCString(), 0), 5_000);
  assertEquals(retryAfterMs("soon", 0), null);
  assertEquals(retryAfterMs(null, 0), null);
});

// The first production run gave up after one retry (#69)
Deno.test("getJson gets through three 429s in a row", async () => {
  const npm = fakeNpm({ "https://x/": [limited(), limited("3"), limited(), ok({ a: 1 })] });
  const client = createNpmClient({ ...npm.options, deadline: 100_000 });

  assertEquals(await client.getJson("https://x/"), { a: 1 });
  // Increasing waits, or what npm asks for
  assertEquals(npm.waits, [2_000, 3_000, 8_000]);
});

Deno.test("getJson gives up after its tries, and says why", async () => {
  const npm = fakeNpm({ "https://x/": [limited(), limited(), limited(), limited()] });
  const client = createNpmClient({ ...npm.options, deadline: 100_000 });

  await assertRejects(() => client.getJson("https://x/"), Error, "429 from https://x/ after 4 tries");
});

Deno.test("getJson doesn't wait past the deadline", async () => {
  const npm = fakeNpm({ "https://x/": [limited("60"), ok({})] });
  const client = createNpmClient({ ...npm.options, deadline: 10_000 });

  await assertRejects(() => client.getJson("https://x/"), Error, "out of time");
  assertEquals(npm.waits, []);
});

Deno.test("getJson doesn't retry what can't succeed", async () => {
  const npm = fakeNpm({ "https://x/": [() => new Response("no", { status: 404 })] });
  const client = createNpmClient({ ...npm.options, deadline: 100_000 });

  await assertRejects(() => client.getJson("https://x/"), Error, "404");
  assertEquals(npm.requests.length, 1);
});

Deno.test("dailyDownloads asks for unscoped packages in bulk, scoped ones one by one", async () => {
  const npm = fakeNpm({
    [range("a,constructor")]: [ok({ a: { downloads: days }, constructor: { downloads: days } })],
    [range("%40s%2Fone")]: [ok({ downloads: days })],
    [range("%40s%2Ftwo")]: [limited(), ok({ downloads: days })],
  });
  const client = createNpmClient({ ...npm.options, deadline: 100_000, spacingMs: 1_000 });
  const result = await client.dailyDownloads(["@s/one", "a", "@s/two", "constructor"], YEAR);

  assertEquals(npm.requests, [range("a,constructor"), range("%40s%2Fone"), range("%40s%2Ftwo"), range("%40s%2Ftwo")]);
  assertEquals([...result.keys()].sort(), ["@s/one", "@s/two", "a", "constructor"]);
  assertEquals(result.get("constructor"), days);
  // A second between requests, plus the retry's wait
  assertEquals(npm.waits, [1_000, 1_000, 2_000]);
});

Deno.test("dailyDownloads reads npm's answer for a single unscoped name", async () => {
  const npm = fakeNpm({ [range("solo")]: [ok({ package: "solo", downloads: days })] });
  const client = createNpmClient({ ...npm.options, deadline: 100_000 });

  assertEquals((await client.dailyDownloads(["solo"], YEAR)).get("solo"), days);
});

Deno.test("dailyDownloads leaves out a package npm doesn't know in bulk", async () => {
  const npm = fakeNpm({ [range("a,b")]: [ok({ a: { downloads: days }, b: null })] });
  const client = createNpmClient({ ...npm.options, deadline: 100_000 });

  assertEquals((await client.dailyDownloads(["a", "b"], YEAR)).get("b"), []);
});

// 12 months with a 29 February are 366 days, more than a bulk query takes
Deno.test("dailyDownloads splits a bulk query over 365 days, and not a scoped one", async () => {
  const leap = { start: "2027-03-01", end: "2028-02-29" };
  const first = [{ day: "2027-03-01", downloads: 1 }];
  const last = [{ day: "2028-02-29", downloads: 2 }];
  const npm = fakeNpm({
    [range("a,b", "2027-03-01:2028-02-28")]: [ok({ a: { downloads: first }, b: { downloads: first } })],
    [range("a,b", "2028-02-29:2028-02-29")]: [ok({ a: { downloads: last }, b: null })],
    [range("%40s%2Fone", "2027-03-01:2028-02-29")]: [ok({ downloads: [...first, ...last] })],
  });
  const client = createNpmClient({ ...npm.options, deadline: 100_000 });
  const result = await client.dailyDownloads(["a", "b", "@s/one"], leap);

  assertEquals(npm.requests.length, 3);
  assertEquals(result.get("a"), [...first, ...last]);
  assertEquals(result.get("b"), first);
  assertEquals(result.get("@s/one"), [...first, ...last]);
});
