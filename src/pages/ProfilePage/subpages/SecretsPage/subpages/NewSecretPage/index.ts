import { Container } from '../../../../../../components/layout/Container';
import type { PagePropsType } from '../../../../../../lib/spa/types';
import { supabase } from '../../../../../../services/supabase';

import { TokenSettings } from './components/TokenSettings';

const html = String.raw;

export type NewSecretPagePropsType = PagePropsType;

export const NewSecretPage = async (
  props: NewSecretPagePropsType,
  signal: AbortSignal
) => {
  console.log(props, signal);

  return html`<section class="new-secret-page">
    ${Container({
      size: 'small',
      children: html`${await TokenSettings({ supabase, signal })}`
    })}
  </section>`;
};
