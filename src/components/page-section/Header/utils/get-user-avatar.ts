import type { Session } from '@supabase/supabase-js';

import { getGravatarUrl } from './get-gravatar-url';

export const getUserAvatar = async (session?: Session) => {
  if (!session) return null;

  const { user } = session;
  const { user_metadata } = user;
  const { avatar_url, email } = user_metadata;

  if (!avatar_url || avatar_url == '') return await getGravatarUrl(email);

  return avatar_url;
};
