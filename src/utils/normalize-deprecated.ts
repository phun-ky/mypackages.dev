export type DeprecatedNormalized = boolean;

export const normalizeDeprecated = (
  v: string | undefined
): DeprecatedNormalized => {
  if (v) {
    return true;
  }

  return false;
};
