import { AuthPage } from '../../features/auth/auth-page';
import { addOnAfterAppRender, addOnClick } from '../../lib/spa';
import type { PagePropsType } from '../../lib/spa/types';
import { navigateTo } from '../../lib/spa/utils/navigate-to';
import { signInWithGitHub } from '../../services/github';

export type SignInPagePropsType = PagePropsType;

export const SignInPage = async (props: SignInPagePropsType) => {
  const { session } = props;

  addOnClick('signin', () => {
    signInWithGitHub();
  });

  addOnAfterAppRender(async () => {
    if (session) {
      const urlParams = new URLSearchParams(window.location.search);
      const returnTo = urlParams.get('returnTo') || '/dashboard';

      // after successful auth:
      await navigateTo(returnTo);
    }
  });

  return AuthPage({ mode: 'signin' });
};
