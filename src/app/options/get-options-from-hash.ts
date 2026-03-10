import { DEFAULT_OPTIONS } from '/config';

import type { Config } from '/types';

export const getOptionsFromHash = (): Config => {
  try {
    const url = new URL(window.location.href);

    return JSON.parse(atob(url.hash.replace('#options=', '')));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // do nothing
  }

  return DEFAULT_OPTIONS;
};
