import { normalizePath } from './utils/normalize-path';
import { printMenu } from './utils/print-menu';

import './styles/navigation.css';

export type NavigationPropsType = {
  username?: string;
  page: string;
};

const html = String.raw;

export type NavigationItem = {
  path?: string;
  itemClassName?: string;
  actionClassName?: string;
  name: string;
  icon?: string;
  children?: NavigationItem[];
};

export const Navigation = (props: NavigationPropsType) => {
  const { username, page } = props;

  if (
    page === 'StartPage' ||
    page === 'SignInPage' ||
    page === 'AboutPage' ||
    page === 'FeedbackPage' ||
    page === 'HelpPage' ||
    page === 'FAQPage'
  )
    return '';

  console.log('Navigation', username);

  const currentPath = normalizePath(window.location.pathname);
  const navigationItems: NavigationItem[] = [
    {
      path: '/dashboard',
      name: 'Dashboard',
      icon: html`<svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="currentColor"
      >
        <path
          d="M530-600v-220h290v220H530ZM140-460v-360h290v360H140Zm390 320v-360h290v360H530Zm-390 0v-220h290v220H140Zm60-380h170v-240H200v240Zm390 320h170v-240H590v240Zm0-460h170v-100H590v100ZM200-200h170v-100H200v100Zm170-320Zm220-140Zm0 220ZM370-300Z"
        />
      </svg>`
    },
    {
      path: '/packages',
      name: 'Packages',
      icon: html`<svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="currentColor"
      >
        <path
          d="M450-177.23v-285.54L200-607.54v278.62q0 3.07 1.54 5.77 1.54 2.69 4.61 4.61L450-177.23Zm60 0 243.85-141.31q3.07-1.92 4.61-4.61 1.54-2.7 1.54-5.77v-278.62L510-462.77v285.54Zm-66.15 65.46L176.16-265.85q-17.08-9.84-26.62-26.3-9.54-16.47-9.54-36.16v-303.38q0-19.69 9.54-36.16 9.54-16.46 26.62-26.3l267.69-154.08q17.07-9.85 36.15-9.85t36.15 9.85l267.69 154.08q17.08 9.84 26.62 26.3 9.54 16.47 9.54 36.16v303.38q0 19.69-9.54 36.16-9.54 16.46-26.62 26.3L516.15-111.77q-17.07 9.85-36.15 9.85t-36.15-9.85ZM634.23-604 727-657.23 486.15-796.54q-3.07-1.92-6.15-1.92-3.08 0-6.15 1.92l-86.85 50L634.23-604ZM480-514.46l93-53.85-247-142.77-93 53.85 247 142.77Z"
        />
      </svg>`
    },
    {
      path: '/users',
      name: 'Users',
      icon: html`<svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="currentColor"
      >
        <path
          d="M480-492.31q-57.75 0-98.87-41.12Q340-574.56 340-632.31q0-57.75 41.13-98.87 41.12-41.13 98.87-41.13 57.75 0 98.87 41.13Q620-690.06 620-632.31q0 57.75-41.13 98.88-41.12 41.12-98.87 41.12ZM180-187.69v-88.93q0-29.38 15.96-54.42 15.96-25.04 42.66-38.5 59.3-29.07 119.65-43.61 60.35-14.54 121.73-14.54t121.73 14.54q60.35 14.54 119.65 43.61 26.7 13.46 42.66 38.5Q780-306 780-276.62v88.93H180Zm60-60h480v-28.93q0-12.15-7.04-22.5-7.04-10.34-19.11-16.88-51.7-25.46-105.42-38.58Q534.7-367.69 480-367.69q-54.7 0-108.43 13.11-53.72 13.12-105.42 38.58-12.07 6.54-19.11 16.88-7.04 10.35-7.04 22.5v28.93Zm240-304.62q33 0 56.5-23.5t23.5-56.5q0-33-23.5-56.5t-56.5-23.5q-33 0-56.5 23.5t-23.5 56.5q0 33 23.5 56.5t56.5 23.5Zm0-80Zm0 384.62Z"
        />
      </svg>`
    },

    {
      name: 'Feedback',
      itemClassName: 'push-from-top',
      path: '/help/feedback',
      icon: html`<svg
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 -960 960 960"
      >
        <path
          d="M480-371.54q13.92 0 23.11-9.19 9.2-9.19 9.2-23.12 0-13.92-9.2-23.11-9.19-9.19-23.11-9.19t-23.11 9.19q-9.2 9.19-9.2 23.11 0 13.93 9.2 23.12 9.19 9.19 23.11 9.19m-30-139.23h60v-241.54h-60zM100-118.46v-669.23Q100-818 121-839t51.31-21h615.38Q818-860 839-839t21 51.31v455.38Q860-302 839-281t-51.31 21H241.54zM216-320h571.69q4.62 0 8.46-3.85 3.85-3.84 3.85-8.46v-455.38q0-4.62-3.85-8.46-3.84-3.85-8.46-3.85H172.31q-4.62 0-8.46 3.85-3.85 3.84-3.85 8.46v523.08zm-56 0v-480z"
        />
      </svg>`
    },
    {
      name: 'Help',
      path: '/help',
      icon: html`<svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="currentColor"
      >
        <path
          d="M450-290h60v-230h-60v230Zm30-298.46q13.73 0 23.02-9.29t9.29-23.02q0-13.73-9.29-23.02-9.29-9.28-23.02-9.28t-23.02 9.28q-9.29 9.29-9.29 23.02t9.29 23.02q9.29 9.29 23.02 9.29Zm.07 488.46q-78.84 0-148.21-29.92t-120.68-81.21q-51.31-51.29-81.25-120.63Q100-401.1 100-479.93q0-78.84 29.92-148.21t81.21-120.68q51.29-51.31 120.63-81.25Q401.1-860 479.93-860q78.84 0 148.21 29.92t120.68 81.21q51.31 51.29 81.25 120.63Q860-558.9 860-480.07q0 78.84-29.92 148.21t-81.21 120.68q-51.29 51.31-120.63 81.25Q558.9-100 480.07-100Zm-.07-60q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"
        />
      </svg>`
    }
  ];

  return html`<nav class="navigation">
    ${printMenu(navigationItems, currentPath)}
  </nav>`;
};
