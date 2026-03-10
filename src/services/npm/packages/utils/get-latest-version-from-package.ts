import type { NpmRegistryPackument } from '../../../../types';
import type { PackageDetails } from '../resolve-package-details';

export const getLatestVersionFromPackage = (
  details: PackageDetails | NpmRegistryPackument
) => {
  if (!details) return null;

  const { 'dist-tags': distTags, versions } = details;
  const { latest } = distTags || {};

  if (!latest && versions && Object.keys(versions).length) {
    return Object.keys(versions).reverse()[0] || null;
  }

  if (latest) return latest;

  return null;
};
