import {
  getPathAfterSignIn,
  rememberPathAfterSignIn
} from '../../app/routing/return-after-sign-in';
import { navigateTo } from '../../lib/spa/utils/navigate-to';
import { supabase } from '../supabase';

export const signInWithGitHub = async () => {
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

  // eslint-disable-next-line no-console -- sign-in has no other place to say why it failed
  if (error) console.error(error);
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    // eslint-disable-next-line no-console -- sign-out has no other place to say why it failed
    console.error(error);

    return;
  }

  navigateTo(window.location.pathname);
};
