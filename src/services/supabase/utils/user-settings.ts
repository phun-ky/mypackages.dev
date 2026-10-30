import type { Session } from '@supabase/supabase-js';

import { supabase } from '..';
import { HOUR_MS } from '../../../constants/temporal';
import { cachedAsync } from '../../../utils/storage/cached-async';
import { lsKey } from '../../../utils/storage/ls-key';
import { ttlLocalStorage } from '../../../utils/storage/ttl-local-storage';

export type UserSettings = {
  /** The user's own npm username, from the profile page */
  npmUsername: string | null;
  /** Profile pictures from GitHub and gravatar.com instead of initials (#37) */
  showProfilePictures: boolean;
};

const NONE: UserSettings = { npmUsername: null, showProfilePictures: false };
const cache = new Map<string, Promise<UserSettings> | UserSettings>();
const key = (userId: string) => `user-settings:${userId}`;

/**
 * The signed-in user's settings, cached for an hour. The defaults without a
 * session, or when they can't be read.
 */
export const getUserSettings = async (
  session?: Session | null
): Promise<UserSettings> => {
  if (!session) return NONE;

  try {
    return await cachedAsync(
      cache,
      key(session.user.id),
      { ttlMs: HOUR_MS },
      async () => {
        const { data, error } = await supabase
          .from('user_settings')
          .select('npm_username, show_profile_pictures')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (error) throw error;

        return {
          npmUsername: data?.npm_username?.trim() || null,
          showProfilePictures: data?.show_profile_pictures === true
        };
      }
    );
  } catch {
    return NONE;
  }
};

/** Forgets the cached settings, after they're saved. */
export const forgetUserSettings = (userId: string) => {
  cache.delete(key(userId));
  ttlLocalStorage.del(lsKey(key(userId)));
};
