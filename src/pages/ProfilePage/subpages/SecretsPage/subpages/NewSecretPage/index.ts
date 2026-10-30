import type { PagePropsType } from '../../../../../../lib/spa/types';
import { supabase } from '../../../../../../services/supabase';

import { TokenSettings } from './components/TokenSettings';

import '../../../../styles/profilePage.css';

export type NewSecretPagePropsType = PagePropsType;

export const NewSecretPage = async (
  _props: NewSecretPagePropsType,
  signal: AbortSignal
) =>
  `<div class="account-page new-secret-page nebula-page">
  <div class="account-wrap">
    <h1>npm tokens</h1>
    <p><a href="/profile/secrets" data-link>Back to your tokens</a></p>
    ${await TokenSettings({ supabase, signal })}
  </div>
</div>`;
