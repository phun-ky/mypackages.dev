import {
  resolveSearchTarget,
  type ResolveMode
} from '../../../services/search/resolve-search-target';

export const resolvePathFromQueryTerm = async (
  queryTermToUse: string,
  signal?: AbortSignal
) => {
  const mode = (
    document.querySelector(
      'input[name="kind"]:checked'
    ) as HTMLInputElement | null
  )?.value as ResolveMode | undefined;
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
