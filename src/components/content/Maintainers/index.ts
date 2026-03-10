import type { NpmIdentity } from '../../../types';
import { EmphasizedCard } from '../EmphasizedCard';
import './styles/maintainers.css';

export type MaintainersPropsType = {};

const html = String.raw;

export const Maintainers = (maintainers: NpmIdentity[]) => {
  return html`${EmphasizedCard({
    title: 'Maintainers',
    icon: html`<svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 -960 960 960"
    >
      <path
        d="M71.93-187.69v-88.93q0-30.92 15.96-55.19t42.63-37.76q57.02-27.89 114.67-43.01 57.66-15.11 126.73-15.11 69.08 0 126.73 15.11 57.66 15.12 114.68 43.01 26.67 13.49 42.63 37.76t15.96 55.19v88.93zm679.99 0v-93.85q0-39.38-19.28-75.07-19.29-35.68-54.72-61.23 40.23 6 76.39 18.57 36.15 12.58 69 29.73 31 16.54 47.88 38.99 16.88 22.44 16.88 49.01v93.85zm-380-304.62q-57.75 0-98.87-41.12-41.12-41.13-41.12-98.88t41.12-98.87q41.12-41.13 98.87-41.13t98.88 41.13q41.12 41.12 41.12 98.87t-41.12 98.88q-41.13 41.12-98.88 41.12m345.38-140q0 57.75-41.12 98.88-41.12 41.12-98.87 41.12-6.77 0-17.23-1.54-10.47-1.54-17.23-3.38 23.66-28.45 36.37-63.12 12.7-34.67 12.7-72 0-37.34-12.96-71.73-12.96-34.38-36.11-63.3 8.61-3.08 17.23-4 8.61-.93 17.23-.93 57.75 0 98.87 41.13 41.12 41.12 41.12 98.87M131.92-247.69h480v-28.93q0-12.53-6.27-22.3-6.26-9.77-19.88-17.08-49.38-25.46-101.69-38.58-52.31-13.11-112.16-13.11-59.84 0-112.15 13.11-52.31 13.12-101.69 38.58-13.62 7.31-19.89 17.08t-6.27 22.3zm240-304.62q33 0 56.5-23.5t23.5-56.5-23.5-56.5-56.5-23.5-56.5 23.5-23.5 56.5 23.5 56.5 56.5 23.5m0-80"
      />
    </svg>`,
    type: 'subtle',
    className: 'maintainers',
    children: html`<div class="maintainers-inner">
      <span class="total">${maintainers.length}</span>
      <div class="avatars">
        ${maintainers
          .map(({ name }) => {
            return html`<a
              href="https://www.npmjs.com/~${name}"
              rel="noopener noreferrer"
              target="_blank"
            >
              <img
                src="https://avatars.githubusercontent.com/${name}"
                alt="${name}"
                title="${name}"
                loading="lazy"
              />
            </a>`;
          })
          .join('\n')}
      </div>
    </div> `
  })}

  </div>`;
};
