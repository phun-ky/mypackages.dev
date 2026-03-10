import { DEFAULT_OPTIONS } from '/config';

export const lsKey = (k: string) => `${DEFAULT_OPTIONS.cachePrefix}${k}`;
