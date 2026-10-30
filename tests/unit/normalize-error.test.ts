import * as fc from 'fast-check';

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { normalizeError } from '../../src/utils/error/normalize-error';

describe('normalizeError', () => {
  test('reads an Error', () => {
    const error = new TypeError('Failed to fetch');
    const normalized = normalizeError(error);

    assert.equal(normalized.name, 'TypeError');
    assert.equal(normalized.message, 'Failed to fetch');
    assert.equal(normalized.stack, error.stack);
    assert.equal(normalized.code, undefined);
  });

  // As production logged it on 2026-10-30
  test('reads a PostgREST error, a plain object', () => {
    assert.deepEqual(
      normalizeError({
        code: '42501',
        details: null,
        hint: 'Grant the role select',
        message: 'permission denied for table ensured_packages'
      }),
      {
        name: 'Error',
        message: 'permission denied for table ensured_packages',
        code: '42501',
        details: 'Grant the role select'
      }
    );
  });

  test('reads an HTTP status as the code', () => {
    assert.equal(
      normalizeError({ status: 502, message: 'Bad gateway' }).code,
      '502'
    );
  });

  test('reads a string, nothing and objects without a message', () => {
    assert.deepEqual(normalizeError('Out of time'), {
      name: 'Error',
      message: 'Out of time'
    });

    for (const value of [undefined, null, '', 0, false, {}]) {
      assert.equal(normalizeError(value).message, 'Unknown error');
    }

    assert.equal(normalizeError({ reason: 'x' }).message, '{"reason":"x"}');

    const circular: Record<string, unknown> = {};

    circular.self = circular;
    assert.equal(normalizeError(circular).message, 'Unknown error');
  });

  test('always gives a name and a message that are text', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        const { name, message } = normalizeError(value);

        assert.equal(typeof name, 'string');
        assert.ok(message.length > 0);
        assert.notEqual(message, '[object Object]');
      })
    );
  });
});
