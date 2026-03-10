import type { Config } from './types';

export const DEFAULT_OPTIONS: Config = {
  cachePrefix: 'npmdash:',

  locale: 'en-GB',
  defaultRole: 'author',
  role: 'author',
  responseSize: 250,
  maintainer: true
};

export const isConfigKey = (key: string, obj: Config): key is keyof Config => {
  return key in obj;
};
