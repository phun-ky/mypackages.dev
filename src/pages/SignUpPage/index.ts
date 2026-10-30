import { AuthPage } from '../../features/auth/auth-page';
import { addOnClick } from '../../lib/spa';
import type { PagePropsType } from '../../lib/spa/types';
import { signInWithGitHub } from '../../services/github';

export type SignUpPagePropsType = PagePropsType;

// Signing up is signing in with GitHub for the first time
export const SignUpPage = async () => {
  addOnClick('signin', () => {
    signInWithGitHub();
  });

  return AuthPage({ mode: 'signup' });
};
