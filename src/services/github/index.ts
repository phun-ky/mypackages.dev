import { navigateTo } from '../../lib/spa/utils/navigate-to';
import { supabase } from '../supabase';

export const signInWithGitHub = async () => {
  console.log('signing in');

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}${window.location.pathname}`
    }
  });

  if (error) console.error(error);
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error(error);

    return;
  }

  navigateTo(window.location.pathname);
};
