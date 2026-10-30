import type { NpmRegistryPackument } from '../../types';

// A packument has every version's manifest, the README and everyone who
// starred the package: up to 2.4 MB, which filled localStorage after two
// pages (#112). The site reads the latest version's manifest, the README's
// length for the quality score, and the publish times.

/** The README is scored at more than 200 and 500 characters */
export const README_CHARS = 1000;

/**
 * The parts of a packument the site reads: the versions the dist-tags point
 * at (or the last one, without a `latest` tag), the publish times, and the
 * README cut to README_CHARS.
 */
export const trimPackument = (
  packument: NpmRegistryPackument
): NpmRegistryPackument => {
  const versions = packument.versions ?? {};
  const keep = new Set<string>(
    Object.values(packument['dist-tags'] ?? {}).filter(
      (v): v is string => typeof v === 'string'
    )
  );

  if (!packument['dist-tags']?.latest) {
    const last = Object.keys(versions).at(-1);

    if (last) keep.add(last);
  }

  const trimmed: NpmRegistryPackument & { users?: unknown } = {
    ...packument
  };

  // Everyone who starred the package, which nothing reads
  delete trimmed.users;

  return {
    ...trimmed,
    versions: Object.fromEntries(
      Object.entries(versions).filter(([version]) => keep.has(version))
    ),
    ...(typeof packument.readme === 'string' && {
      readme: packument.readme.slice(0, README_CHARS)
    })
  };
};
