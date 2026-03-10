import type { NpmRegistryPackument } from '../../types';
import type { PackageDetails } from '../npm/packages/resolve-package-details';
import { getPackageByVersion } from '../npm/packages/utils/get-package-by-version';

export type GetDependenciesMetaParamsType = {
  version?: string | null;
  pkg: NpmRegistryPackument | PackageDetails;
};

export const getDependenciesMeta = ({
  version,
  pkg
}: GetDependenciesMetaParamsType) => {
  const { devDependencies, peerDependencies, dependencies } =
    getPackageByVersion({
      version,
      pkg
    }) || {};
  const sumDev = Object.keys(devDependencies || {}).length;
  const sumDep = Object.keys(dependencies || {}).length;
  const sumPeer = Object.keys(peerDependencies || {}).length;

  return {
    devDependencies: sumDev,
    peerDependencies: sumPeer,
    dependencies: sumDep,
    total: sumDev + sumPeer + sumDep
  };
};
