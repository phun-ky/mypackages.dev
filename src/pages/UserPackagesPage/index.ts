import { Content } from '../../components/page-section/Content';
import { Settings } from '../../features/dashboard/settings';
import type { PagePropsType } from '../../lib/spa/types';
import { getUserPackages } from '../../services/npm/packages/get-user-packages';

import { PackageCardsBox } from './components/PackageCardsBox';

import './styles/userPackagesPage.css';

const html = String.raw;

export type UserPackagesPagePropsType = PagePropsType;

export const UserPackagesPage = async (
  props: UserPackagesPagePropsType,
  signal: AbortSignal
) => {
  console.log(props, signal);

  const { username, options } = props;

  if (!username || username === '') return html`no user found`;

  const packages = await getUserPackages(username, signal, options);

  return html`<section class="user-packages-page">
    ${Content({
      children: html`${Settings({ options })}${await PackageCardsBox({
        options,
        packages,
        signal
      })} `
    })}
  </section>`;
};
