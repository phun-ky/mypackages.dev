export type NpmPackageLicenseObject = {
  type?: string;
  name?: string;
  url?: string;
};

export type NpmPackageLicense = string | NpmPackageLicenseObject;

export type NpmRole = 'author' | 'maintainer';

export type NpmPackageName = string;

export type NpmPackageNames = NpmPackageName[];

export type NpmRegistrySearchResponse = {
  objects: NpmSearchObject[];
  total: number;
  time: string; // ISO
};

type NumericString = `${number}`;

export type NpmSearchObject = {
  downloads: {
    monthly: number;
    weekly: number;
  };
  dependents: number | NumericString; // seen as "3" sometimes
  updated: string; // ISO
  searchScore: number;
  package: NpmPackage;
  score: {
    final: number;
    detail: {
      popularity: number;
      quality: number;
      maintenance: number;
    };
  };
  flags: {
    insecure: 0 | 1; // 0/1
  };
};

export type NpmPackageLinks = {
  npm?: string;
  homepage?: string;
  repository?: string;
  bugs?: string;
};

export type NpmPackage = {
  name: NpmPackageName;
  keywords?: string[];
  version: string;
  description?: string;
  sanitized_name: string;

  publisher: NpmSearchUser;

  maintainers: NpmSearchUser[];

  license?: NpmPackageLicense; // registry search typically returns string
  date?: string; // ISO publish date (latest)
  links: NpmPackageLinks;
};

export type NpmIdentity = {
  name?: string;
  username?: string;
  email?: string;
  url?: string;
};

export type NpmSearchUser =
  | NpmIdentity
  | (NpmIdentity & {
      actor: NpmIdentity;
    });

export type NpmDistTags = { latest: string } & Record<string, string>;

export type NpmScripts = Record<string, string>;

export type NpmDependencies = Record<string, string>;

export interface NpmBugs {
  url?: string;
  email?: string;
}

export interface NpmRepository {
  type?: string;
  url?: string;
  directory?: string;
}

export interface NpmDistSignature {
  sig: string;
  keyid: string;
}

export interface NpmDist {
  shasum?: string;
  tarball: string;
  integrity?: string;
  signatures?: NpmDistSignature[];
  fileCount?: number;
  unpackedSize?: number;
  attestations?: {
    url: string;
    provenance: { predicateType: string };
  };

  /** npm sometimes adds extra dist fields */
  [key: string]: unknown;
}

export type NpmEngines = {
  node?: string;
  npm?: string;
  pnpm?: string;
  yarn?: string;
  [tool: string]: string | undefined;
};

export interface NpmPublishConfig {
  access?: 'public' | 'restricted' | (string & {});
  [key: string]: unknown;
}

export interface NpmOperationalInternal {
  tmp?: string;
  host?: string;
  [key: string]: unknown;
}

export interface NpmUser {
  name?: string;
  email?: string;

  /** some payloads nest actor info */
  actor?: {
    name?: string;
    type?: string;
    email?: string;
    [key: string]: unknown;
  };

  [key: string]: unknown;
}

export interface NpmPackageVersion {
  name: NpmPackageName;
  version: string;
  deprecated?: string;
  description?: string;
  keywords?: string[];
  license?: NpmPackageLicense;

  author?: NpmIdentity | string;
  contributors?: Array<NpmIdentity | string>;
  maintainers?: NpmIdentity[];

  homepage?: string;
  bugs?: NpmBugs;
  repository?: NpmRepository;

  main?: string;
  module?: string;
  types?: string;
  typings?: string;
  type?: 'module' | 'commonjs' | (string & {});
  exports?: unknown;

  directories?: Record<string, string>;
  files?: string[];

  scripts?: NpmScripts;
  dependencies?: NpmDependencies;
  devDependencies?: NpmDependencies;
  peerDependencies?: NpmDependencies;
  optionalDependencies?: NpmDependencies;
  bundledDependencies?: string[] | boolean;

  engines?: NpmEngines;
  publishConfig?: NpmPublishConfig;
  funding?:
    | string
    | { type?: string; url?: string }
    | Array<string | { type?: string; url?: string }>;

  dist: NpmDist;

  /** npm-injected metadata */
  _id?: string;
  _npmUser?: NpmUser;
  _npmVersion?: string;
  _nodeVersion?: string;
  _hasShrinkwrap?: boolean;
  _npmOperationalInternal?: NpmOperationalInternal;
  gitHead?: string;
}

export type NpmPackumentTimeProperty = {
  created: string;
  modified: string;
  [key: string]: string;
};

export interface NpmRegistryPackument {
  _id: string;
  _rev?: string;
  name: NpmPackageName;
  author?: NpmIdentity | string;
  'dist-tags'?: NpmDistTags;
  versions?: Record<string, NpmPackageVersion>;
  license?: NpmPackageLicense;
  homepage?: string;
  keywords?: string[];

  time?: NpmPackumentTimeProperty;
  readme?: string;
  maintainers?: NpmIdentity[];
  repository?: NpmRepository;

  bugs?: { url: string };
  description?: string;
  readmeFilename?: string;
}
