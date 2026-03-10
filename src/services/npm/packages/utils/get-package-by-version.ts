import type {
  NpmPackageVersion,
  NpmRegistryPackument
} from '../../../../types';
import type { PackageDetails } from '../resolve-package-details';

export type GetPackageByVersionParamsType = {
  version?: string | null;
  pkg: NpmRegistryPackument | PackageDetails;
};

export const getPackageByVersion = ({
  version,
  pkg
}: GetPackageByVersionParamsType): NpmPackageVersion | null => {
  if (!version || (version && version === '')) return null;

  if (!pkg) return null;

  const { versions } = pkg;

  if (!versions || (versions && !Object.keys(versions).length)) return null;

  const packageByVersion = versions[version];

  return packageByVersion;
};
