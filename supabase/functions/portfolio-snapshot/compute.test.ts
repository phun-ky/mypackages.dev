import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import fc from "https://esm.sh/fast-check@4";

import {
  changePct,
  computeSnapshot,
  monthlyTotals,
  type PackageInput,
  sumMonths,
} from "./compute.ts";

const daysInMonth = (month: string) => {
  const [year, m] = month.split("-").map(Number);

  return new Date(Date.UTC(year, m, 0)).getUTCDate();
};

// Every day of a month, or the first `count`
const days = (month: string, perDay: number, count = daysInMonth(month)) =>
  Array.from({ length: count }, (_, i) => ({
    day: `${month}-${String(i + 1).padStart(2, "0")}`,
    downloads: perDay,
  }));

Deno.test("monthlyTotals sums per month and leaves out the current month", () => {
  const daily = [...days("2026-08", 1), ...days("2026-09", 2), ...days("2026-10", 5)];

  assertEquals(monthlyTotals(daily, "2026-10"), { "2026-08": 31, "2026-09": 60 });
});

// npm's last-year started on 2025-10-27 on 2026-10-28, so its oldest month
// had 5 days and looked like a drop
Deno.test("monthlyTotals leaves out a month the data doesn't have every day of", () => {
  const daily = [
    ...days("2025-10", 100).slice(26),
    ...days("2025-11", 1),
    ...days("2026-02", 2, 27),
    ...days("2026-03", 3),
  ];

  assertEquals(monthlyTotals(daily, "2026-10"), { "2025-11": 30, "2026-03": 93 });
});

Deno.test("monthlyTotals counts 29 February in a leap year", () => {
  assertEquals(monthlyTotals(days("2028-02", 1), "2028-03"), { "2028-02": 29 });
  assertEquals(monthlyTotals(days("2028-02", 1, 28), "2028-03"), {});
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
  // 2026-08: 31 + 3100 = 3131, 2026-09: 30 + 6000 + 300 = 6330
  assertEquals(snapshot.months, [
    { month: "2026-08", downloads: 3131 },
    { month: "2026-09", downloads: 6330 },
  ]);
  assertEquals(snapshot.change_pct, ((6330 - 3131) / 3131) * 100);
  assertEquals(snapshot.top_packages, [
    { name: "big", monthly: 900, change_pct: ((6000 - 3100) / 3100) * 100 },
    { name: "middle", monthly: 50, change_pct: null },
    { name: "small", monthly: 10, change_pct: ((30 - 31) / 31) * 100 },
  ]);
});

Deno.test("computeSnapshot keeps the latest 12 months, oldest first", () => {
  const daily = Array.from({ length: 14 }, (_, i) =>
    days(new Date(Date.UTC(2025, 8 + i, 1)).toISOString().slice(0, 7), i),
  ).flat();
  const { months } = computeSnapshot(
    [{ name: "a", monthly: 0, daily }],
    new Date("2026-12-15T00:00:00Z"),
  );

  assertEquals(months.length, 12);
  assertEquals(months[0].month, "2025-11");
  assertEquals(months.at(-1)!.month, "2026-10");
});

// Every download in a complete month is counted exactly once, and none from
// a month a package's data has only some days of, or from the current month
Deno.test("sumMonths of monthlyTotals adds up to every complete month's downloads", () => {
  const month = fc.record({
    month: fc.constantFrom("2026-02", "2026-07", "2026-09", "2026-10"),
    perDay: fc.nat({ max: 1_000_000 }),
    // Days missing from the end of the month, 0 for a complete one
    missing: fc.oneof(fc.constant(0), fc.integer({ min: 1, max: 27 })),
  });
  const pkg = fc.uniqueArray(month, { selector: (m) => m.month });

  fc.assert(
    fc.property(fc.array(pkg), (perPackage) => {
      const totals = sumMonths(
        perPackage.map((months) =>
          monthlyTotals(
            months.flatMap(({ month, perDay, missing }) =>
              days(month, perDay, daysInMonth(month) - missing)
            ),
            "2026-10",
          )
        ),
      );
      const expected = perPackage
        .flat()
        .filter(({ month, missing }) => month !== "2026-10" && missing === 0)
        .reduce((sum, { month, perDay }) => sum + perDay * daysInMonth(month), 0);

      assertEquals(Object.values(totals).reduce((a, b) => a + b, 0), expected);
    }),
  );
});
