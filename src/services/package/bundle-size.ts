import type { ReleaseHealth } from '../../types';
import { formatBytes } from '../../utils/format-bytes';
import type { PackageDetails } from '../npm/packages/resolve-package-details';

export type BundleSizeParamsType = {
  releaseHealth?: ReleaseHealth;
  details: PackageDetails;
  opts?: {
    humanReadable: boolean;
  };
};

export const bundleSize = ({
  releaseHealth,
  details,
  opts
}: BundleSizeParamsType) => {
  const { humanReadable = true } = opts || {};
  const latest = releaseHealth?.latestVersion;
  const v = latest ? details.versions?.[latest] : undefined;
  const installBytes = v?.dist?.unpackedSize ?? null;

  if (humanReadable) return formatBytes(installBytes);

  return {
    label: '${installBytes} B',
    unit: 'B',
    value: `${installBytes}`
  };
};
