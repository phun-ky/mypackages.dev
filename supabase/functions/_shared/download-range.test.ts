import { assertEquals } from "jsr:@std/assert@1";
import fc from "npm:fast-check@4";

import {
  completeMonthsRange,
  daysIn,
  downloadRange,
  rangePath,
  splitRange,
} from "./download-range.ts";

// On 2026-10-28, npm's last-year ran from 2025-10-27, so October had 5 days
Deno.test("downloadRange starts on the first day of the month a year back", () => {
  assertEquals(downloadRange(new Date("2026-10-28T11:00:00Z")), {
    start: "2025-10-01",
    end: "2026-10-27",
  });
});

Deno.test("downloadRange on the first of a month ends with the month before", () => {
  assertEquals(downloadRange(new Date("2026-01-01T00:30:00Z")), {
    start: "2025-01-01",
    end: "2025-12-31",
  });
});

Deno.test("downloadRange stays within the 18 months npm allows", () => {
  fc.assert(
    fc.property(
      fc.date({ min: new Date("2000-01-01"), max: new Date("2100-01-01"), noInvalidDate: true }),
      (now) => {
        const days = daysIn(downloadRange(now));

        assertEquals(days >= 365 && days <= 366 + 31, true);
      },
    ),
  );
});

Deno.test("completeMonthsRange is the last 12 complete months", () => {
  assertEquals(completeMonthsRange(new Date("2026-10-28T11:00:00Z")), {
    start: "2025-10-01",
    end: "2026-09-30",
  });
  assertEquals(completeMonthsRange(new Date("2028-03-31T23:59:59Z")), {
    start: "2027-03-01",
    end: "2028-02-29",
  });
});

Deno.test("rangePath is the range as npm takes it", () => {
  assertEquals(rangePath({ start: "2025-10-01", end: "2026-09-30" }), "2025-10-01:2026-09-30");
});

Deno.test("splitRange leaves a range that fits alone", () => {
  const range = { start: "2025-10-01", end: "2026-09-30" };

  assertEquals(splitRange(range, 365), [range]);
});

Deno.test("splitRange covers every day once, in parts that fit", () => {
  fc.assert(
    fc.property(
      fc.date({ min: new Date("2000-01-01"), max: new Date("2100-01-01"), noInvalidDate: true }),
      fc.integer({ min: 1, max: 400 }),
      (now, maxDays) => {
        const range = downloadRange(now);
        const parts = splitRange(range, maxDays);

        assertEquals(parts[0].start, range.start);
        assertEquals(parts.at(-1)!.end, range.end);
        assertEquals(parts.reduce((sum, part) => sum + daysIn(part), 0), daysIn(range));

        for (const part of parts) assertEquals(daysIn(part) <= maxDays, true);
      },
    ),
  );
});
