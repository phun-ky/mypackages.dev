import * as fc from 'fast-check';

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { routes } from '../../src/lib/spa/router/routes';
import { getRouterMatch } from '../../src/lib/spa/router/utils/get-router-match';
import { getParams } from '../../src/lib/spa/utils/get-params';

// The router reads the path from `location`, as in the browser
const matchPath = (pathname: string) => {
  Object.defineProperty(globalThis, 'location', {
    value: { pathname },
    configurable: true
  });

  const match = getRouterMatch(routes);

  return { match, params: getParams(match) };
};
// npm usernames and package names: lowercase letters, digits, - . _
const part = fc.stringMatching(/^[a-z0-9][a-z0-9._-]{0,20}$/);
const packageName = fc.oneof(
  part,
  fc.tuple(part, part).map(([scope, name]) => `@${scope}/${name}`)
);

describe('router', () => {
  test('matches every route without parameters to itself', () => {
    for (const route of routes.filter((r) => !r.path.includes(':'))) {
      assert.equal(matchPath(route.path).match.route.page, route.page);
    }
  });

  test('gives back the username it matched', () => {
    fc.assert(
      fc.property(part, (username) => {
        const user = matchPath(`/users/${username}`);
        const packages = matchPath(`/users/${username}/packages`);

        assert.equal(user.match.route.page, 'UserPage');
        assert.deepEqual(user.params, { username });
        assert.equal(packages.match.route.page, 'UserPackagesPage');
        assert.deepEqual(packages.params, { username });
      })
    );
  });

  test('gives back the package name it matched, scoped or not', () => {
    fc.assert(
      fc.property(packageName, (name) => {
        const { match, params } = matchPath(`/packages/${name}`);

        assert.equal(match.route.page, 'PackagePage');
        assert.deepEqual(params, { packageName: name });
      })
    );
  });

  // Route parameters reach the page, so markup in a crafted URL must not
  test('sends a parameter with markup to the page not found page', () => {
    for (const path of [
      '/users/<img src=x onerror=alert(1)>',
      '/packages/a"b',
      "/packages/@x/y'z",
      '/users/a&b'
    ]) {
      assert.equal(matchPath(path).match.route.page, 'PageNotFoundPage', path);
    }
  });
});
