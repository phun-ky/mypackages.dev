import { resolvePathAndNavigate } from '../search/resolve-path-and-navigate';

import type { HandleQueryTermOptsType } from './handle-query-term-to-use-keydown';

export const handleShowMeClick =
  (opts: HandleQueryTermOptsType) => async (event: Event) => {
    const inputElement = document.querySelector('#query-term-to-use');

    if (!(inputElement instanceof HTMLInputElement)) return;

    event.preventDefault();

    const queryTermToUse = inputElement.value;

    if (!queryTermToUse.trim()) return;

    await resolvePathAndNavigate(queryTermToUse, opts);
    inputElement.value = '';
  };
