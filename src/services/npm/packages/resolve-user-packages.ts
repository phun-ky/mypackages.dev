import type {
  Config,
  BuildUserPackagesReturn,
  NpmPackage
} from '../../../types';
import { uniqueStrings } from '../../../utils';
import { supabase } from '../../supabase';
import { searchPackagesByUserRole } from '../search-packages-by-user-role';
import { getTrackedPackages, mergeIntoTracked } from '../tracked';

import { mapToUserPackageResult } from './utils/map-to-user-package-result';

export const resolveUserPackages = async (
  username: string,
  signal: AbortSignal,
  options?: Config
): Promise<BuildUserPackagesReturn> => {
  if (!options) return [];

  const { maintainer } = options;
  const role = maintainer ? 'maintainer' : 'author';
  const searchData = await searchPackagesByUserRole(
    supabase,
    username,
    options,
    signal
  );
  const fromSearch = (searchData.objects || [])
    .map((o) => o.package?.name)
    .filter(Boolean);

  await mergeIntoTracked(fromSearch, username, role, signal);

  const tracked = await getTrackedPackages(username, role, signal);
  const allNames = uniqueStrings([...fromSearch, ...tracked]);
  const byName: Map<
    string,
    { pkg: NpmPackage; updated: string; monthly: number }
  > = new Map();

  for (const obj of searchData.objects || []) {
    const p = obj.package;

    if (!p?.name) continue;

    byName.set(p.name, {
      pkg: p,
      updated: obj.updated,
      monthly: parseInt(`${obj.downloads?.monthly}`) || 0
    });
  }

  const packages = await Promise.all(
    allNames.map(mapToUserPackageResult(byName, signal))
  );

  return packages;
};
