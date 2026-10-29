import { assertEquals } from "jsr:@std/assert@1";
import fc from "https://esm.sh/fast-check@4";

import {
  changePct,
  completeMonthTotals,
  lastMonths,
  latestMonth,
  summarizeDownloads,
  sumMonths,
} from "./downloads.ts";

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

Deno.test("completeMonthTotals sums per month and leaves out the month so far", () => {
  const daily = [...days("2026-08", 1), ...days("2026-09", 2), ...days("2026-10", 5, 28)];

  assertEquals({ ...completeMonthTotals(daily) }, { "2026-08": 31, "2026-09": 60 });
});

// npm's last-year started on 2025-10-27 on 2026-10-28, so its oldest month
// had 5 days and looked like a drop (#93)
Deno.test("completeMonthTotals leaves out a month the data doesn't have every day of", () => {
  const daily = [
    ...days("2025-10", 100).slice(26),
    ...days("2025-11", 1),
    ...days("2026-02", 2, 27),
    ...days("2026-03", 3),
  ];

  assertEquals({ ...completeMonthTotals(daily) }, { "2025-11": 30, "2026-03": 93 });
});

Deno.test("completeMonthTotals counts 29 February in a leap year", () => {
  assertEquals({ ...completeMonthTotals(days("2028-02", 1)) }, { "2028-02": 29 });
  assertEquals({ ...completeMonthTotals(days("2028-02", 1, 28)) }, {});
});

Deno.test("completeMonthTotals isn't fooled by Object.prototype keys", () => {
  const totals = completeMonthTotals([{ day: "constructor", downloads: 1 }]);

  assertEquals(Object.keys(totals), []);
});

Deno.test("summarizeDownloads has the month so far and the last day", () => {
  const daily = [...days("2026-08", 1), ...days("2026-09", 2), ...days("2026-10", 5, 27)];

  assertEquals(summarizeDownloads(daily), {
    totals: completeMonthTotals(daily),
    sinceLastMonth: 135,
    end: "2026-10-27",
  });
  assertEquals(summarizeDownloads([]), { totals: {}, sinceLastMonth: 0, end: null });
});

// A package published this month has no complete month yet
Deno.test("summarizeDownloads counts every day as this month without complete months", () => {
  const { totals, sinceLastMonth } = summarizeDownloads(days("2026-10", 4, 10));

  assertEquals({ ...totals }, {});
  assertEquals(sinceLastMonth, 40);
});

Deno.test("latestMonth and lastMonths go by month, not by insertion", () => {
  const totals = { "2026-09": 3, "2026-07": 1, "2026-08": 2 };

  assertEquals(latestMonth(totals), { month: "2026-09", downloads: 3 });
  assertEquals(latestMonth({}), null);
  assertEquals(lastMonths(totals, 2), [
    { month: "2026-08", downloads: 2 },
    { month: "2026-09", downloads: 3 },
  ]);
});

Deno.test("changePct compares the latest two months", () => {
  assertEquals(changePct({ "2026-08": 100, "2026-09": 150 }), 50);
  assertEquals(changePct({ "2026-09": 150, "2026-08": 100 }), 50);
  assertEquals(changePct({ "2026-09": 150 }), null);
  assertEquals(changePct({ "2026-08": 0, "2026-09": 0 }), 0);
  assertEquals(changePct({ "2026-08": 0, "2026-09": 4 }), null);
});

// Every download in a complete month is counted exactly once, and none from
// a month a package's data has only some days of
Deno.test("sumMonths of completeMonthTotals adds up to every complete month's downloads", () => {
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
          completeMonthTotals(
            months.flatMap(({ month, perDay, missing }) =>
              days(month, perDay, daysInMonth(month) - missing)
            ),
          )
        ),
      );
      const expected = perPackage
        .flat()
        .filter(({ missing }) => missing === 0)
        .reduce((sum, { month, perDay }) => sum + perDay * daysInMonth(month), 0);

      assertEquals(Object.values(totals).reduce((a, b) => a + b, 0), expected);
    }),
  );
});
