import { Container } from '../../components/layout/Container';
import { PackagesOverview } from '../../features/dashboard/packages-overview';
import { Settings } from '../../features/dashboard/settings';
import type { PagePropsType } from '../../lib/spa/types';
import { getUserPackages } from '../../services/npm/packages/get-user-packages';

import './styles/userPage.css';

const html = String.raw;

export type UserPagePropsType = PagePropsType;

export const UserPage = async (
  props: UserPagePropsType,
  signal: AbortSignal
) => {
  console.log(props, signal);

  const { username, options } = props;

  if (!username || username === '') return html`no user found`;

  const packages = await getUserPackages(username, signal, options);

  return html`<section class="user-page">
    ${Settings({ options })}
    ${Container({ children: html` <h1>${username}</h1>` })}
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
