import * as fc from 'fast-check';

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { DAY_MS } from '../../src/constants/temporal';
import { packageHealth } from '../../src/services/package/health';
import { packagePopularity } from '../../src/services/package/popularity';
import { scoreCadence } from '../../src/utils/score-cadence';
import { scoreRecency } from '../../src/utils/score-recency';

const inRange = (n: number) => Number.isFinite(n) && n >= 0 && n <= 100;
// Any score a metric could report, including ones out of range or not a number
const anyScore = fc.oneof(
  fc.double(),
  fc.constantFrom(Number.NaN, Infinity, -Infinity, undefined)
);
const metric = fc.option(
  fc.record({
    scorePct: anyScore,
    key: fc.option(fc.constantFrom('deprecated', 'fresh', 'risk'), {
      nil: undefined
    })
  }),
  { nil: undefined }
);

describe('scoreRecency', () => {
  test('stays in range and never rises with age', () => {
    fc.assert(
      fc.property(fc.nat({ max: 5000 }), fc.nat({ max: 5000 }), (a, b) => {
        const [younger, older] = a <= b ? [a, b] : [b, a];

        assert.ok(inRange(scoreRecency(younger)));
        assert.ok(scoreRecency(older) <= scoreRecency(younger));
      })
    );
  });
});

describe('scoreCadence', () => {
  test('stays in range and never rises as releases slow down', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (a, b) => {
          const [faster, slower] = a <= b ? [a, b] : [b, a];

          assert.ok(inRange(scoreCadence(faster * DAY_MS)));
          assert.ok(
            scoreCadence(slower * DAY_MS) <= scoreCadence(faster * DAY_MS)
          );
        }
      )
    );
  });

  test('is neutral when the cadence is unknown', () => {
    assert.equal(scoreCadence(undefined), 50);
    assert.equal(scoreCadence(null), 50);
    assert.equal(scoreCadence(0), 50);
  });
});

describe('packagePopularity', () => {
  test('stays in range and never falls with more downloads', () => {
    fc.assert(
      fc.property(fc.nat({ max: 1e10 }), fc.nat({ max: 1e10 }), (a, b) => {
        const [fewer, more] = a <= b ? [a, b] : [b, a];
        const low = packagePopularity(fewer).scorePct;
        const high = packagePopularity(more).scorePct;

        assert.ok(inRange(low) && inRange(high));
        assert.ok(high >= low);
      })
    );
  });

  test('labels by the download thresholds', () => {
    assert.equal(packagePopularity(99).label, 'low');
    assert.equal(packagePopularity(100).label, 'relative-low');
    assert.equal(packagePopularity(10_000).label, 'decent');
  });

  test('gives a change only with a previous period, never Infinity', () => {
    assert.equal(packagePopularity(10).changePct, undefined);
    assert.equal(packagePopularity(150, 100).changePct, 50);
    assert.equal(packagePopularity(5, 0).changePct, 100);
    assert.equal(packagePopularity(0, 0).changePct, 0);
  });
});

describe('packageHealth', () => {
  test('gives a score and a confidence in range for any metrics', () => {
    fc.assert(
      fc.property(
        fc.record({
          maintenance: metric,
          popularity: metric,
          quality: metric,
          security: metric,
          provenance: metric
        }),
        (args) => {
          const health = packageHealth(args);

          assert.ok(inRange(health.scorePct), `score ${health.scorePct}`);
          assert.ok(inRange(health.confidencePct));
        }
      )
    );
  });

  test('is unknown without metrics', () => {
    assert.deepEqual(packageHealth({}), {
      scorePct: 50,
      label: 'Unknown',
      confidencePct: 0,
      meta: { weighted: {}, weightsUsed: {} }
    });
  });

  test('never calls a deprecated package healthy', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 100 }), (score) => {
        const health = packageHealth({
          maintenance: { scorePct: score, key: 'deprecated' },
          quality: { scorePct: 100 },
          security: { scorePct: 100 }
        });

        assert.ok(health.scorePct <= 15);
        assert.equal(health.label, 'Poor');
      })
    );
  });

  test('caps a risky package, however good the rest is', () => {
    const health = packageHealth({
      maintenance: { scorePct: 100 },
      quality: { scorePct: 100 },
      popularity: { scorePct: 100 },
      security: { scorePct: 30 },
      provenance: { scorePct: 100 }
    });

    assert.ok(health.scorePct <= 55);
  });
});
