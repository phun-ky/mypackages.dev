import { DEFAULT_OPTIONS } from '../config';
import type { Config } from '../types';

export const setOptions = (opts: Config) => {
  let savedOptions: Partial<Config>;

  try {
    const url = new URL(window.location.href);

    savedOptions = JSON.parse(atob(url.hash.replace('#options=', '')));
  } catch {
    savedOptions = {};
  }

  const options = {
    ...DEFAULT_OPTIONS,
    ...savedOptions,
    ...opts
  };

  window.location.hash = `options=${btoa(JSON.stringify(options))}`;
};
