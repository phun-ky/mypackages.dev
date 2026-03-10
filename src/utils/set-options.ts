/* eslint-disable @typescript-eslint/no-unused-vars */
import { DEFAULT_OPTIONS } from '../config';
import type { Config } from '../types';

export const setOptions = (opts: Config) => {
  let savedOptions = {};

  try {
    const url = new URL(window.location.href);

    savedOptions = JSON.parse(atob(url.hash.replace('#options=', '')));
  } catch (e) {
    savedOptions = {};
  }

  const options = {
    ...DEFAULT_OPTIONS,
    ...savedOptions,
    ...opts
  };

  window.location.hash = `options=${btoa(JSON.stringify(options))}`;
};
