import {
  getPathAfterSignIn,
  rememberPathAfterSignIn
} from '../../app/routing/return-after-sign-in';
import { navigateTo } from '../../lib/spa/utils/navigate-to';
import { supabase } from '../supabase';

export const signInWithGitHub = async () => {
  console.log('signing in');

  rememberPathAfterSignIn(getPathAfterSignIn());

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      // Always `/`, which is index.html on GitHub Pages. Other paths are
      // served by 404.html, which redirects before the Supabase client can
      // read the callback.
      redirectTo: `${window.location.origin}/`
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
