import type { Session } from '@supabase/supabase-js';

import { supabase } from '..';
import { HOUR_MS } from '../../../constants/temporal';
import { cachedAsync } from '../../../utils/storage/cached-async';
import { lsKey } from '../../../utils/storage/ls-key';
import { ttlLocalStorage } from '../../../utils/storage/ttl-local-storage';

// Profile pictures come from GitHub and gravatar.com, which then learn who
// looks at which page, so they're shown only to a signed-in user who turns
// them on (#37). Off, the site shows initials and asks neither.

const cache = new Map<string, Promise<boolean> | boolean>();
const key = (session: Session) => `profile-pictures:${session.user.id}`;

/** Whether the signed-in user shows profile pictures. Off without a session. */
export const getShowProfilePictures = async (
  session?: Session | null
): Promise<boolean> => {
  if (!session) return false;

  try {
    return await cachedAsync(
      cache,
      key(session),
      { ttlMs: HOUR_MS },
      async () => {
        const { data, error } = await supabase
          .from('user_settings')
          .select('show_profile_pictures')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (error) throw error;

        return data?.show_profile_pictures === true;
      }
    );
  } catch {
    return false;
  }
};

/** Saves the setting, and forgets the cached one. */
export const setShowProfilePictures = async (
  session: Session,
  show: boolean
) => {
  const { error } = await supabase
    .from('user_settings')
    .upsert(
      { user_id: session.user.id, show_profile_pictures: show },
      { onConflict: 'user_id' }
    );

  cache.delete(key(session));
  ttlLocalStorage.del(lsKey(key(session)));

  if (error) throw error;
};
