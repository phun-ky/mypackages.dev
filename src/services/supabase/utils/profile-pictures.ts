import type { Session } from '@supabase/supabase-js';

import { supabase } from '..';

import { forgetUserSettings, getUserSettings } from './user-settings';

// Profile pictures come from GitHub and gravatar.com, which then learn who
// looks at which page, so they're shown only to a signed-in user who turns
// them on (#37). Off, the site shows initials and asks neither.

/** Whether the signed-in user shows profile pictures. Off without a session. */
export const getShowProfilePictures = async (session?: Session | null) =>
  (await getUserSettings(session)).showProfilePictures;

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

  forgetUserSettings(session.user.id);

  if (error) throw error;
};
