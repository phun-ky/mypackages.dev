import type { PagePropsType } from '../../lib/spa/types';
import './styles/usersPage.css';

const html = String.raw;

export const UsersPage = async (props: PagePropsType, signal: AbortSignal) => {
  console.log(props, signal);

  return html`<section class="users-page"><h1>Users</h1></section>`;
};
