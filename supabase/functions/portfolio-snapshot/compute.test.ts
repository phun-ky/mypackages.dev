import { assertEquals } from "jsr:@std/assert@1";

import { computeSnapshot, type PackageInput } from "./compute.ts";

const daysInMonth = (month: string) => {
  const [year, m] = month.split("-").map(Number);

  return new Date(Date.UTC(year, m, 0)).getUTCDate();
};

// Every day of a month
const days = (month: string, perDay: number) =>
  Array.from({ length: daysInMonth(month) }, (_, i) => ({
    day: `${month}-${String(i + 1).padStart(2, "0")}`,
    downloads: perDay,
  }));

Deno.test("computeSnapshot matches the user page", () => {
  const packages: PackageInput[] = [
    { name: "small", daily: [...days("2026-08", 1), ...days("2026-09", 1)] },
    { name: "big", daily: [...days("2026-08", 100), ...days("2026-09", 200)] },
    { name: "middle", daily: days("2026-09", 10) },
    { name: "tiny", daily: [] },
  ];
  const snapshot = computeSnapshot(packages);

  assertEquals(snapshot.package_count, 4);
  // 2026-08: 31 + 3100 = 3131, 2026-09: 30 + 6000 + 300 = 6330
  assertEquals(snapshot.months, [
    { month: "2026-08", downloads: 3131 },
    { month: "2026-09", downloads: 6330 },
  ]);
  assertEquals(snapshot.change_pct, ((6330 - 3131) / 3131) * 100);
  assertEquals(snapshot.top_packages, [
    { name: "big", monthly: 6000, change_pct: ((6000 - 3100) / 3100) * 100 },
    { name: "middle", monthly: 300, change_pct: null },
    { name: "small", monthly: 30, change_pct: ((30 - 31) / 31) * 100 },
  ]);
});

// The headline came from npm's search, a rolling 30 days, and the change from
// calendar months (#94)
Deno.test("computeSnapshot's headline is the last month of the chart", () => {
  const snapshot = computeSnapshot([
    { name: "a", daily: [...days("2026-08", 1), ...days("2026-09", 3)] },
    { name: "b", daily: days("2026-09", 2) },
  ]);

  assertEquals(snapshot.monthly_downloads, 150);
  assertEquals(snapshot.monthly_downloads, snapshot.months.at(-1)!.downloads);
  assertEquals(
    snapshot.top_packages.reduce((sum, pkg) => sum + pkg.monthly, 0),
    snapshot.monthly_downloads,
  );
});

Deno.test("computeSnapshot keeps the latest 12 months, oldest first", () => {
  const daily = Array.from({ length: 14 }, (_, i) =>
    days(new Date(Date.UTC(2025, 8 + i, 1)).toISOString().slice(0, 7), i),
  ).flat();
  const { months } = computeSnapshot([{ name: "a", daily }]);

  assertEquals(months.length, 12);
  assertEquals(months[0].month, "2025-11");
  assertEquals(months.at(-1)!.month, "2026-10");
});

Deno.test("computeSnapshot of nothing is zero", () => {
  assertEquals(computeSnapshot([]), {
    package_count: 0,
    monthly_downloads: 0,
    change_pct: null,
    months: [],
    top_packages: [],
  });
});
