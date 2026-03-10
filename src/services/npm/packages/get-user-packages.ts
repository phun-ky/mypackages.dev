import type { Config } from '../../../types';

import { resolveUserPackages } from './resolve-user-packages';

export const getUserPackages = async (
  username: string,
  signal: AbortSignal,
  options?: Config
) => {
  return await resolveUserPackages(username, signal, options);
};
