import { Alert } from '../../components/feedback/Alert';
import { Container } from '../../components/layout/Container';
import { PackagesOverview } from '../../features/dashboard/packages-overview';
import { Settings } from '../../features/dashboard/settings';
import type { UserSettingsRow } from '../../features/profile/npm-settings/mount';
import type { PagePropsType } from '../../lib/spa/types';
import { getUserPackages } from '../../services/npm/packages/get-user-packages';
import { supabase } from '../../services/supabase';

import './styles/dashboardPage.css';

const html = String.raw;

export type DashboardPagePropsType = PagePropsType;

export const DashboardPage = async (
  props: DashboardPagePropsType,
  signal: AbortSignal
) => {
  const { options, session } = props;

  if (!session) return html`You need to be logged in to see this page`;

  const userId = session.user.id;
  const { data } = await supabase
    .from('user_settings')
    .select(
      'user_id,npm_username,npm_email,lookup_as_maintainer,npm_query_size'
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) return 'No data found';

  const row = data as UserSettingsRow;
  const { npm_username: username } = row;

  if (!username || username === '') {
    return html`<section class="dashboard-page">
      ${Container({ children: html` <h1>Dashboard</h1>` })}
      ${Container({
        children: html`
          ${Alert({
            title: 'Username missing',
            description: html`<p>
              Please save your npm username in the profile settings
            </p>`,
            type: 'warning'
          })}
        `
      })}
    </section>`;
  }

  const packages = await getUserPackages(username, signal, options);

  return html`<section class="dashboard-page">
    ${Settings({ options })}
    ${Container({ children: html` <h1>Dashboard</h1>` })}
    ${Container({
      children: html`${await PackagesOverview(
        {
          username,
          options,
          packages
        },
        signal
      )} `
    })}
  </section>`;
};
