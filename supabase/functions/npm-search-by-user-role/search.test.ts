import { assertEquals, assertRejects } from "jsr:@std/assert@1";

import { clampSize, MAX_PACKAGES, searchAll, SearchError } from "./search.ts";

const pkgs = (count: number, start = 0) =>
  Array.from({ length: count }, (_, i) => ({ package: { name: `pkg-${start + i}` } }));

// Plays npm's search for a user with `total` packages: answers each request
// from its `from` and `size`, or with `status` for the pages listed in `fail`
const fakeSearch = (total: number, fail: Record<number, number> = {}) => {
  const requests: string[] = [];

  return {
    requests,
    fetch: (input: string | URL | Request) => {
      const url = new URL(String(input));
      const from = Number(url.searchParams.get("from") ?? 0);
      const size = Number(url.searchParams.get("size"));

      requests.push(`${from}+${size}`);

      if (fail[from]) return Promise.resolve(new Response("", { status: fail[from] }));

      const count = Math.max(0, Math.min(size, total - from));

      return Promise.resolve(
        Response.json({ objects: pkgs(count, from), total, time: "2026-10-30T00:00:00Z" }),
      );
    },
  };
};

Deno.test("clampSize keeps the size between 1 and 500", () => {
  assertEquals(clampSize(250), 250);
  assertEquals(clampSize(5000), MAX_PACKAGES);
  assertEquals(clampSize(0), 1);
  assertEquals(clampSize(12.7), 12);
  assertEquals(clampSize("nope"), 50);
  assertEquals(clampSize(undefined), 50);
});

Deno.test("searchAll asks once for a user with up to 250 packages", async () => {
  const npm = fakeSearch(163);
  const res = await searchAll("maintainer:someone", 500, npm);

  assertEquals(npm.requests, ["0+250"]);
  assertEquals(res.objects.length, 163);
  assertEquals(res.total, 163);
  assertEquals(res.time, "2026-10-30T00:00:00Z");
});

Deno.test("searchAll stops at the total", async () => {
  const npm = fakeSearch(413);
  const res = await searchAll("maintainer:isaacs", 500, npm);

  assertEquals(npm.requests, ["0+250", "250+250"]);
  assertEquals(res.objects.length, 413);
  assertEquals(res.objects.at(-1), { package: { name: "pkg-412" } });
  assertEquals(res.total, 413);
});

Deno.test("searchAll stops at the cap and says how many there are", async () => {
  const npm = fakeSearch(1074);
  const res = await searchAll("maintainer:sindresorhus", 500, npm);

  assertEquals(npm.requests, ["0+250", "250+250"]);
  assertEquals(res.objects.length, 500);
  assertEquals(res.total, 1074);
});

Deno.test("searchAll asks for no more than the size", async () => {
  const npm = fakeSearch(1074);
  const res = await searchAll("maintainer:sindresorhus", 300, npm);

  assertEquals(npm.requests, ["0+250", "250+50"]);
  assertEquals(res.objects.length, 300);
});

// npm's total can be ahead of what it returns
Deno.test("searchAll stops on an empty page", async () => {
  const requests: string[] = [];
  const res = await searchAll("maintainer:someone", 500, {
    fetch: (input) => {
      const from = new URL(String(input)).searchParams.get("from") ?? "0";

      requests.push(from);

      return Promise.resolve(
        Response.json({ objects: from === "0" ? pkgs(250) : [], total: 900 }),
      );
    },
  });

  assertEquals(requests, ["0", "250"]);
  assertEquals(res.objects.length, 250);
  assertEquals(res.total, 900);
});

Deno.test("searchAll leaves out a package that comes twice", async () => {
  const res = await searchAll("maintainer:someone", 500, {
    fetch: (input) => {
      const from = Number(new URL(String(input)).searchParams.get("from") ?? 0);

      // The second page starts with the first page's last package, and goes
      // on to the 300th
      return Promise.resolve(
        Response.json({ objects: from ? pkgs(51, 249) : pkgs(250), total: 300 }),
      );
    },
  });

  assertEquals(res.objects.length, 300);
  assertEquals(new Set(res.objects.map((o) => o.package?.name)).size, 300);
});

Deno.test("searchAll fails when the first page does", async () => {
  const npm = fakeSearch(100, { 0: 503 });
  const error = await assertRejects(
    () => searchAll("maintainer:someone", 500, npm),
    SearchError,
  );

  assertEquals(error.status, 503);
});

Deno.test("searchAll keeps the first page when a later one fails", async () => {
  const npm = fakeSearch(1074, { 250: 429 });
  const res = await searchAll("maintainer:sindresorhus", 500, npm);

  assertEquals(res.objects.length, 250);
  assertEquals(res.total, 1074);
});
