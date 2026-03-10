import type { NpmRegistrySearchResponse } from '../../../../types';
import { isValidEmail } from '../../../../utils/is-valid-email';
import { lsKey } from '../../../../utils/storage/ls-key';
import { ttlLocalStorage } from '../../../../utils/storage/ttl-local-storage';

export type HasDependentsParamsType = {
  role?: 'author' | 'maintainer';
  username?: string;
  packageName: string;
};

export const hasDependents = (params: HasDependentsParamsType) => {
  const { role, username, packageName } = params;

  console.log('hasDependents', role, username, packageName);

  if (!role || !username) return null;

  const query =
    isValidEmail(username) && role === 'author'
      ? `author.email:${username}`
      : `${role}:${username}`;
  const key = `search:${query}`;
  const hit = ttlLocalStorage.get(
    lsKey(key)
  ) as NpmRegistrySearchResponse | null;

  if (!hit) return null;

  const { objects } = hit;
  const object = objects.find((obj) => {
    return obj.package.name === packageName;
  });

  if (object) {
    return object.dependents || 0;
  }

  return null;
};
