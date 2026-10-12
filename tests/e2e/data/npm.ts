/**
 * Test data in the shapes the Supabase edge functions return, which pass on
 * responses from the npm registry and downloads APIs.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const isoDay = (date: Date) => date.toISOString().slice(0, 10);

type Packument = Record<string, unknown> & { name: string };

/**
 * A registry packument with one release, published a month ago. Fields in
 * `overrides` replace the package-level and latest-version fields.
 */
export const packument = (
  name: string,
  overrides: Record<string, unknown> = {}
): Packument => {
  const published = new Date(Date.now() - 30 * DAY_MS).toISOString();
  const fields = {
    name,
    description: `The ${name} package`,
    keywords: ['testing'],
    license: 'MIT',
    homepage: `https://github.com/example/${name}#readme`,
    bugs: { url: `https://github.com/example/${name}/issues` },
    repository: {
      type: 'git',
      url: `git+https://github.com/example/${name}.git`
    },
    maintainers: [{ name: 'example', email: 'example@example.com' }],
    ...overrides
  };

  return {
    ...fields,
    'dist-tags': { latest: '1.0.0' },
    versions: {
      '1.0.0': {
        ...fields,
        version: '1.0.0',
        dependencies: {},
        dist: { unpackedSize: 12_345 }
      }
    },
    time: { created: published, modified: published, '1.0.0': published },
    readme: ''
  };
};

/** Daily downloads for the last year, in the npm downloads API shape */
export const lastYearDownloads = (name: string, perDay = 100) => {
  const end = new Date();
  const start = new Date(end.getTime() - 364 * DAY_MS);
  const downloads = Array.from({ length: 365 }, (_, i) => ({
    day: isoDay(new Date(start.getTime() + i * DAY_MS)),
    downloads: perDay
  }));

  return { downloads, package: name, start: isoDay(start), end: isoDay(end) };
};

/**
 * An npm search response listing `names`, as the user search returns it
 */
export const searchResponse = (username: string, names: string[]) => {
  const updated = new Date(Date.now() - 30 * DAY_MS).toISOString();

  return {
    objects: names.map((name) => ({
      package: {
        name,
        version: '1.0.0',
        description: `The ${name} package`,
        keywords: ['testing'],
        date: updated,
        links: {
          npm: `https://www.npmjs.com/package/${name}`,
          repository: `https://github.com/example/${name}`
        },
        publisher: { username, email: `${username}@example.com` },
        maintainers: [{ username, email: `${username}@example.com` }]
      },
      downloads: { monthly: 3000, weekly: 700 },
      dependents: 2,
      updated,
      searchScore: 1,
      score: {
        final: 0.5,
        detail: { quality: 0.5, popularity: 0.5, maintenance: 0.5 }
      }
    })),
    total: names.length,
    time: new Date().toISOString()
  };
};
