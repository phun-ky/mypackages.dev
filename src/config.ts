import type { Config } from './types';

export const DEFAULT_OPTIONS: Config = {
  cachePrefix: 'npmdash:',

  locale: 'en-GB',
  responseSize: 250
};

export const isConfigKey = (key: string, obj: Config): key is keyof Config => {
  return key in obj;
};
