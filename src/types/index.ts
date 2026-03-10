export * from './npm';

import type {
  NpmPackageLinks,
  NpmPackageName,
  NpmPackageNames,
  NpmIdentity
} from './npm';

export type PackageLicenseTypeObject = {
  type?: string;
  url?: string;
};

export type PackageLicenseNameObject = {
  name?: string;
  url?: string;
};

/**
 * npm license field can be:
 * - a string: "MIT"
 * - an object: { type: "MIT", url: "..." } (common)
 * - an object: { name: "MIT", url: "..." } (seen sometimes)
 */
export type PackageLicense =
  | string
  | PackageLicenseTypeObject
  | PackageLicenseNameObject
  | null
  | undefined;

export type Username = string;

export type Role = 'author' | 'maintainer';

export type Config = {
  cachePrefix: string;
  username?: Username;
  // Maximum items in response
  responseSize?: number;
  locale: string;
  defaultRole: Role;
  role: Role;
  maintainer: boolean;
  deprecatedPackages?: NpmPackageNames;
};

export type PackageEngines =
  | {
      node?: string;
      npm?: string;
      pnpm?: string;
      yarn?: string;
      [tool: string]: string | undefined;
    }
  | null
  | undefined;

export type RelativeTimeFormatUnit =
  | 'year'
  | 'quarter'
  | 'month'
  | 'week'
  | 'day'
  | 'hour'
  | 'minute'
  | 'second';

export type RelativeTimeFormatUnitsList = {
  unit: RelativeTimeFormatUnit;
  seconds: number;
}[];

export type FetchUserPackagesUnionItem = {
  package: {
    name: NpmPackageName;
    keywords: string[];
    links: NpmPackageLinks;
    date?: string;
    updated: string | undefined;
    maintainers: NpmIdentity[];
    releaseHealth?: ReleaseHealth;
    isTrackedOnly: boolean;

    // spread from search pkg + allow extra registry/search fields
    [key: string]: unknown;
  };
  downloads: {
    monthly: number;
  };
};

export type BuildUserPackagesReturn = FetchUserPackagesUnionItem[];

export type ReleaseHealth = {
  latestVersion: string | null;
  lastPublishMs: number | null;
  lastPublishIso: string | null;
  cadenceAvgMs: number | null;
  cadenceSample: number;
  deprecated: boolean;
  license?: string | null;
  enginesNode: string | null;
  deprecatedMessage: string | null;
  hasTypes: boolean;
};
