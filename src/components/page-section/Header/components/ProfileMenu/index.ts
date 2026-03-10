import type { Session } from '@supabase/supabase-js';

import {
  addClickOutside,
  addOnClick,
  addOnKeyup,
  addOnRouteChange
} from '../../../../../lib/spa';
import { signOut } from '../../../../../services/github';
import { cx } from '../../../../../utils/cx';
import { Button } from '../../../../actions/Button';
import { Link } from '../../../../actions/Link';
import { getInitialsForUser } from '../../utils/get-initials-for-user';
import { getUserAvatar } from '../../utils/get-user-avatar';
import './styles/profileMenu.css';

const html = String.raw;

export const ProfileMenu = async (session?: Session | null) => {
  if (!session || session === null) return '';

  const avatarUrl = await getUserAvatar(session);
  const { user } = session;
  const { user_metadata } = user;
  const { name, user_name, email } = user_metadata;

  console.log(user_metadata);

  const avatar =
    avatarUrl && avatarUrl !== ''
      ? `<img src="${avatarUrl}" alt="${name}" class="avatar" />`
      : `<span class="avatar">${getInitialsForUser(name)}</span>`;
  const menu = [
    {
      type: 'user-meta',
      children: html`<span class="username">${user_name}</span>
        <span class="email">${email}</span>`
    },
    {
      type: 'separator'
    },
    {
      href: '/profile',
      label: 'Profile'
    },
    {
      type: 'separator'
    },
    {
      id: 'logout',
      label: 'Log out'
    }
  ];

  addOnClick('logout', () => {
    signOut();
  });

  const id = 'profile-menu';
  const toggle = (e: Event) => {
    const target = e.target;

    if (!(target instanceof HTMLElement)) return;

    const els = document.querySelectorAll('.profile-menu-launcher.is-open');

    els.forEach((el) => el.classList.remove('is-open'));

    const isOpen = target.classList.toggle('is-open');

    target.setAttribute('aria-expanded', String(isOpen));
  };

  addClickOutside(`profile-menu-wrapper-${id}`, () => {
    const els = document.querySelectorAll('.profile-menu-launcher.is-open');

    els.forEach((el) => el.classList.remove('is-open'));
  });

  addOnRouteChange(() => {
    const els = document.querySelectorAll('.profile-menu-launcher.is-open');

    els.forEach((el) => el.classList.remove('is-open'));
  });

  addOnClick(id, toggle);

  addOnKeyup(`profile-menu-wrapper-${id}`, (e) => {
    if (e.key !== 'Escape') return;

    e.preventDefault();
    document.getElementById(id)?.classList.remove('is-open');
  });

  const profileMenuLauncherClassNames = cx('profile-menu-launcher');

  return html`
    <div class="profile-menu" id="profile-menu-wrapper-${id}">
      <button
        type="button"
        class="${profileMenuLauncherClassNames}"
        title="More"
        aria-haspopup="menu"
        id="${id}"
        aria-controls="${id}-menu"
      >
        ${avatar}
      </button>
      <div class="profile-menu-list-container" id="${id}-menu">
        <ol class="profile-menu-list">
          ${menu
            .map((m) => {
              const { href, id, label, type, children } = m;

              if (type === 'user-meta')
                return html`<li class="user-meta">${children}</li>`;

              if (type === 'separator')
                return html`<li class="separator"></li>`;

              if (!href && id && id !== '') {
                return html`
                  <li>
                    ${Button({
                      id: id,
                      children: label
                    })}
                  </li>
                `;
              } else if (!href) {
                return html` <li><span>${label}</span></li> `;
              } else {
                return html` <li>${Link({ to: href, children: label })}</li> `;
              }
            })
            .join('')}
        </ol>
      </div>
    </div>
  `;
};
