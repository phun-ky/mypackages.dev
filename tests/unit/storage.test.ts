import * as fc from 'fast-check';

import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';

import {
  README_CHARS,
  trimPackument
} from '../../src/services/npm/trim-packument';
import type { NpmRegistryPackument } from '../../src/types';
import {
  MAX_ENTRY_CHARS,
  ttlLocalStorage
} from '../../src/utils/storage/ttl-local-storage';

// localStorage with a quota in characters, as browsers count it
const fakeStorage = (quota: number) => {
  const data = new Map<string, string>();
  const used = () =>
    [...data].reduce((sum, [k, v]) => sum + k.length + v.length, 0);

  return {
    get length() {
      return data.size;
    },
    key: (i: number) => [...data.keys()][i] ?? null,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      const before = data.get(k);

      data.set(k, v);

      if (used() > quota) {
        if (before === undefined) data.delete(k);
        else data.set(k, before);

        throw new DOMException('full', 'QuotaExceededError');
      }
    },
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
    keys: () => [...data.keys()]
  };
};

let storage: ReturnType<typeof fakeStorage>;

const install = (quota: number) => {
  storage = fakeStorage(quota);
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true
  });
};
const entry = (exp: number, size = 10) =>
  JSON.stringify({ v: 'x'.repeat(size), exp });

describe('ttlLocalStorage', () => {
  beforeEach(() => install(10_000));

  test('reads back what it stored, until it expires', () => {
    assert.equal(ttlLocalStorage.set('npmdash:a', [1, 2]), true);
    assert.deepEqual(ttlLocalStorage.get('npmdash:a'), [1, 2]);

    ttlLocalStorage.set('npmdash:old', 1, -1);
    assert.equal(ttlLocalStorage.get('npmdash:old'), null);
  });

  test('keeps an entry over the cap out of storage', () => {
    install(10 * MAX_ENTRY_CHARS);
    storage.setItem('npmdash:big', entry(Date.now() + 1000));

    assert.equal(
      ttlLocalStorage.set('npmdash:big', 'x'.repeat(MAX_ENTRY_CHARS)),
      false
    );
    // An older copy goes too, so it isn't read instead
    assert.equal(storage.getItem('npmdash:big'), null);
  });

  test('when full, removes expired entries, then the soonest to expire', () => {
    const now = Date.now();

    storage.setItem('npmdash:expired', entry(now - 1, 2500));
    storage.setItem('npmdash:soon', entry(now + 1000, 2500));
    storage.setItem('npmdash:later', entry(now + 1e9, 2500));
    // Not the site's: never removed
    storage.setItem('sb-auth-token', 'x'.repeat(900));

    // About 8,500 used: the expired one isn't room enough, the soonest goes too
    assert.equal(ttlLocalStorage.set('npmdash:new', 'x'.repeat(4200)), true);
    assert.deepEqual(storage.keys().sort(), [
      'npmdash:later',
      'npmdash:new',
      'sb-auth-token'
    ]);
  });

  test('gives up when nothing of its own is left to remove', () => {
    storage.setItem('sb-auth-token', 'x'.repeat(9_000));

    assert.equal(ttlLocalStorage.set('npmdash:new', 'x'.repeat(2000)), false);
    assert.deepEqual(storage.keys(), ['sb-auth-token']);
  });

  test('sweep removes expired, oversized and old keys only', () => {
    install(10 * MAX_ENTRY_CHARS);

    const later = Date.now() + 1e9;

    storage.setItem('npmdash:expired', entry(Date.now() - 1));
    storage.setItem('npmdash:corrupt', '{');
    storage.setItem('npmdash:huge', entry(later, MAX_ENTRY_CHARS));
    storage.setItem(
      'npmdash:tracked-packages:someone:maintainer',
      entry(later)
    );
    storage.setItem('npmdash:supabase:ensured-packages', entry(later));
    storage.setItem('npmdash:tracked-packages:v2:someone', entry(later));
    storage.setItem('npmdash:downloads:2026-10:speccer', entry(later));
    storage.setItem('prefers-color-scheme', 'dark');

    ttlLocalStorage.sweep();

    assert.deepEqual(storage.keys().sort(), [
      'npmdash:downloads:2026-10:speccer',
      'npmdash:tracked-packages:v2:someone',
      'prefers-color-scheme'
    ]);
  });
});

const packument = (
  versions: string[],
  distTags: Record<string, string>
): NpmRegistryPackument =>
  ({
    name: 'pkg',
    'dist-tags': distTags,
    versions: Object.fromEntries(
      versions.map((v) => [v, { name: 'pkg', version: v }])
    ),
    time: Object.fromEntries(versions.map((v) => [v, '2026-10-01T00:00:00Z'])),
    readme: 'r'.repeat(5000),
    users: { someone: true }
  }) as unknown as NpmRegistryPackument;

describe('trimPackument', () => {
  test('keeps the versions the dist-tags point at, the times and some README', () => {
    const trimmed = trimPackument(
      packument(['1.0.0', '1.1.0', '2.0.0-beta.1', '1.2.0'], {
        latest: '1.2.0',
        next: '2.0.0-beta.1'
      })
    );

    assert.deepEqual(Object.keys(trimmed.versions!).sort(), [
      '1.2.0',
      '2.0.0-beta.1'
    ]);
    assert.equal(Object.keys(trimmed.time!).length, 4);
    assert.equal(trimmed.readme?.length, README_CHARS);
    assert.equal('users' in trimmed, false);
  });

  test('keeps the last version without a latest tag', () => {
    const trimmed = trimPackument(packument(['0.1.0', '0.2.0'], {}));

    assert.deepEqual(Object.keys(trimmed.versions!), ['0.2.0']);
  });

  test('only ever removes versions', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.stringMatching(/^\d\.\d\.\d$/), { minLength: 1 }),
        fc.nat(),
        (versions, i) => {
          const latest = versions[i % versions.length];
          const trimmed = trimPackument(packument(versions, { latest }));

          assert.deepEqual(Object.keys(trimmed.versions!), [latest]);
          assert.equal(trimmed.versions![latest].version, latest);
        }
      )
    );
  });
});
