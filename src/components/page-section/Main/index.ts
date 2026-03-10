import type { ComponentBasePropsType } from '../../../lib/spa/types';
import { Alert } from '../../feedback/Alert';
import './styles/main.css';

const html = String.raw;

export type MainPropsType = ComponentBasePropsType & {
  page: string;
};

export const Main = (props: MainPropsType) => {
  const { page, children } = props;

  if (
    page === 'UserPage' ||
    page === 'PackagePage' ||
    page === 'DashboardPage'
  ) {
    return html`<main class="main">
      ${Alert({
        title:
          'You are currently using this application without a set npm access token.',
        size: 'wide',
        description: html`This might cause incomplete data due to rate limiting.
        Please register a npm token in your profile to get more complete data.`,
        type: 'warning'
      })}
      ${children}
    </main>`;
  }

  return html`<main class="main">${children}</main>`;
};
