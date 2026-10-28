import {
  type ResolveMode,
  resolveSearchTarget
} from '../../../services/search/resolve-search-target';

export const resolvePathFromQueryTerm = async (
  queryTermToUse: string,
  signal?: AbortSignal,
  mode: ResolveMode = 'auto'
) => {
  const res = await resolveSearchTarget(queryTermToUse, mode, signal);
  const to =
    res.kind === 'package'
      ? `/packages/${res.packageName}`
      : res.kind === 'user'
        ? `/users/${res.username}`
        : `/packages?q=${res.q}`;

  return {
    to,
    res
  };
};
