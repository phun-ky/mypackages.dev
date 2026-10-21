import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import fc from "https://esm.sh/fast-check@4";

import {
  changePct,
  computeSnapshot,
  monthlyTotals,
  type PackageInput,
  sumMonths,
} from "./compute.ts";

const days = (month: string, perDay: number, count = 3) =>
  Array.from({ length: count }, (_, i) => ({
    day: `${month}-${String(i + 1).padStart(2, "0")}`,
    downloads: perDay,
  }));

Deno.test("monthlyTotals sums per month and leaves out the current month", () => {
  const daily = [...days("2026-08", 1), ...days("2026-09", 2), ...days("2026-10", 5)];

  assertEquals(monthlyTotals(daily, "2026-10"), { "2026-08": 3, "2026-09": 6 });
});

Deno.test("monthlyTotals refuses a month that isn't YYYY-MM", () => {
  assertThrows(() => monthlyTotals([], "October"), RangeError);
});

Deno.test("monthlyTotals isn't fooled by Object.prototype keys", () => {
  const totals = monthlyTotals([{ day: "constructor", downloads: 1 }], "2026-10");

  assertEquals(Object.keys(totals), []);
});

Deno.test("changePct compares the latest two months", () => {
  assertEquals(changePct({ "2026-08": 100, "2026-09": 150 }), 50);
  assertEquals(changePct({ "2026-09": 150, "2026-08": 100 }), 50);
  assertEquals(changePct({ "2026-09": 150 }), null);
  assertEquals(changePct({ "2026-08": 0, "2026-09": 0 }), 0);
  assertEquals(changePct({ "2026-08": 0, "2026-09": 4 }), null);
});

Deno.test("computeSnapshot matches the user page", () => {
  const packages: PackageInput[] = [
    { name: "small", monthly: 10, daily: [...days("2026-08", 1), ...days("2026-09", 1)] },
    { name: "big", monthly: 900, daily: [...days("2026-08", 100), ...days("2026-09", 200)] },
    { name: "middle", monthly: 50, daily: days("2026-09", 10) },
    { name: "tiny", monthly: 1, daily: [] },
  ];
  const snapshot = computeSnapshot(packages, new Date("2026-10-21T03:17:00Z"));

  assertEquals(snapshot.package_count, 4);
  assertEquals(snapshot.monthly_downloads, 961);
  // 2026-08: 3 + 300 = 303, 2026-09: 3 + 600 + 30 = 633
  assertEquals(snapshot.months, [
    { month: "2026-08", downloads: 303 },
    { month: "2026-09", downloads: 633 },
  ]);
  assertEquals(snapshot.change_pct, ((633 - 303) / 303) * 100);
  assertEquals(snapshot.top_packages, [
    { name: "big", monthly: 900, change_pct: 100 },
    { name: "middle", monthly: 50, change_pct: null },
    { name: "small", monthly: 10, change_pct: 0 },
  ]);
});

Deno.test("computeSnapshot keeps the latest 12 months, oldest first", () => {
  const daily = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(Date.UTC(2025, 8 + i, 1));

    return { day: date.toISOString().slice(0, 10), downloads: i };
  });
  const { months } = computeSnapshot(
    [{ name: "a", monthly: 0, daily }],
    new Date("2026-12-15T00:00:00Z"),
  );

  assertEquals(months.length, 12);
  assertEquals(months[0].month, "2025-11");
  assertEquals(months.at(-1)!.month, "2026-10");
});

// Every download in a complete month is counted exactly once, whichever way
// the days are spread over packages
Deno.test("sumMonths of monthlyTotals adds up to every complete month's downloads", () => {
  const day = fc
    .record({
      month: fc.constantFrom("2026-07", "2026-08", "2026-09", "2026-10"),
      date: fc.integer({ min: 1, max: 28 }),
      downloads: fc.nat({ max: 1_000_000 }),
    })
    .map(({ month, date, downloads }) => ({
      day: `${month}-${String(date).padStart(2, "0")}`,
      downloads,
    }));

  fc.assert(
    fc.property(fc.array(fc.array(day)), (perPackage) => {
      const totals = sumMonths(perPackage.map((daily) => monthlyTotals(daily, "2026-10")));
      const expected = perPackage
        .flat()
        .filter(({ day }) => !day.startsWith("2026-10"))
        .reduce((sum, { downloads }) => sum + downloads, 0);

      assertEquals(Object.values(totals).reduce((a, b) => a + b, 0), expected);
    }),
  );
});
