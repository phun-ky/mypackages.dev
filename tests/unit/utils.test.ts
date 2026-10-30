import * as fc from 'fast-check';

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { calcMoMChangePct } from '../../src/utils/calc-mom-change-pct';
import { clamp } from '../../src/utils/clamp';
import { escapeAttr, escapeHtml, safeUrl } from '../../src/utils/escape-html';
import { slugify } from '../../src/utils/slugify';
import { truncateText } from '../../src/utils/truncate-text';

describe('clamp', () => {
  test('stays between min and max, and keeps a value already there', () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true }),
        fc.double({ noNaN: true }),
        fc.double({ noNaN: true }),
        (v, a, b) => {
          const [min, max] = a <= b ? [a, b] : [b, a];
          const result = clamp(v, min, max);

          assert.ok(result >= min && result <= max);

          if (v >= min && v <= max) assert.equal(result, v);
        }
      )
    );
  });
});

describe('slugify', () => {
  test('gives lowercase letters, digits and single hyphens', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const slug = slugify(s);

        assert.match(slug, /^[a-z0-9-]*$/);
        assert.doesNotMatch(slug, /--/);
      })
    );
  });

  test('is the same when applied twice', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        assert.equal(slugify(slugify(s)), slugify(s));
      })
    );
  });

  test('keeps the letters of accented characters', () => {
    assert.equal(slugify('  Crème Brûlée  '), 'creme-brulee');
    assert.equal(slugify('@phun-ky/speccer'), 'phun-kyspeccer');
  });
});

// The inverse of escapeHtml, as diff-dom's parser decodes text
const decode = (s: string) =>
  s.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');

describe('escapeHtml', () => {
  test('leaves no tags, and decodes back to the value', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const escaped = escapeHtml(s);

        assert.doesNotMatch(escaped, /[<>]/);
        assert.equal(decode(escaped), s);
      })
    );
  });

  test('turns null and undefined into nothing', () => {
    assert.equal(escapeHtml(null), '');
    assert.equal(escapeHtml(undefined), '');
    assert.equal(escapeHtml(0), '0');
  });
});

describe('escapeAttr', () => {
  test('leaves no double quote to end the attribute', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        assert.doesNotMatch(escapeAttr(s), /"/);
      })
    );
  });
});

describe('safeUrl', () => {
  test('keeps http and https URLs', () => {
    fc.assert(
      fc.property(fc.webUrl(), (url) => {
        assert.equal(safeUrl(url), url);
      })
    );
  });

  test('drops other schemes and anything that is not a URL', () => {
    for (const value of [
      'javascript:alert(1)',
      'JavaScript:alert(1)',
      'data:text/html,<p>',
      'vbscript:x',
      '/relative',
      '',
      null,
      42,
      { href: 'https://example.com' }
    ]) {
      assert.equal(safeUrl(value), undefined, String(value));
    }
  });
});

describe('truncateText', () => {
  test('keeps short text and cuts long text at max', () => {
    fc.assert(
      fc.property(fc.string(), fc.nat({ max: 50 }), (s, max) => {
        const result = truncateText(s, max);

        if (s.length <= max) assert.equal(result, s);
        else assert.equal(result, s.slice(0, max) + '\n…(truncated)');
      })
    );
  });
});

describe('calcMoMChangePct', () => {
  const months = (...downloads: number[]) =>
    downloads.map((d, i) => ({ interval: `2026-0${i + 1}`, downloads: d }));

  test('compares the last two months, to one decimal', () => {
    assert.equal(calcMoMChangePct(months(5, 100, 150)), 50);
    assert.equal(calcMoMChangePct(months(3, 1)), -66.7);
  });

  test('is undefined with fewer than two months, and stable from zero', () => {
    assert.equal(calcMoMChangePct(undefined), undefined);
    assert.equal(calcMoMChangePct(months(4)), undefined);
    assert.equal(calcMoMChangePct(months(0, 0)), 0);
    assert.equal(calcMoMChangePct(months(0, 7)), 100);
  });
});
