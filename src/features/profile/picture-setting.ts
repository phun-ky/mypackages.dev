import type { Session } from '@supabase/supabase-js';

import {
  getShowProfilePictures,
  setShowProfilePictures
} from '../../services/supabase/utils/profile-pictures';

/**
 * The "Show profile pictures" checkbox on the profile page (#37): shows the
 * saved setting, and saves a change straight away.
 */
export const mountPictureSetting = async (
  root: HTMLElement,
  session: Session,
  signal?: AbortSignal
) => {
  const checkbox = root.querySelector('#show-profile-pictures');
  const status = root.querySelector('.picture-setting .status');

  if (!(checkbox instanceof HTMLInputElement)) return;

  const setStatus = (text: string) => {
    if (status) status.textContent = text;
  };

  checkbox.checked = await getShowProfilePictures(session);
  checkbox.addEventListener(
    'change',
    async () => {
      checkbox.disabled = true;
      setStatus('Saving…');

      try {
        await setShowProfilePictures(session, checkbox.checked);
        setStatus('Saved. Shown from the next page you open.');
      } catch {
        checkbox.checked = !checkbox.checked;
        setStatus('Could not save. Try again.');
      } finally {
        checkbox.disabled = false;
      }
    },
    { signal }
  );
};
