import {
  addClickOutside,
  addOnClick,
  addOnKeyup,
  addOnRouteChange
} from '../../../../lib/spa';
import { cx } from '../../../../utils/cx';

const html = String.raw;

export type CrumbMenuPropsType = {
  menu?: {
    label: string;
    href: string;
  }[];
  id: string;
};

export const CrumbMenu = (props: CrumbMenuPropsType) => {
  const { menu, id } = props;

  if (!menu || menu.length === 0) return '';

  const toggle = (e: Event) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const els = document.querySelectorAll('.crumb-menu-trigger.is-open');
    els.forEach((el) => el.classList.remove('is-open'));

    const isOpen = target.classList.toggle('is-open');
    target.setAttribute('aria-expanded', String(isOpen));
  };

  addClickOutside(`crumb-menu-wrapper-${id}`, () => {
    const els = document.querySelectorAll('.crumb-menu-trigger.is-open');
    els.forEach((el) => el.classList.remove('is-open'));
  });

  addOnRouteChange(() => {
    const els = document.querySelectorAll('.crumb-menu-trigger.is-open');
    els.forEach((el) => el.classList.remove('is-open'));
  });

  addOnClick(id, toggle);

  addOnKeyup(`crumb-menu-wrapper-${id}`, (e) => {
    if (e.key !== 'Escape') return;

    e.preventDefault();
    document.getElementById(id)?.classList.remove('is-open');
  });

  const crumbMenuTriggerClassNames = cx('crumb-menu-trigger');

  return html`
    <div class="crumb-menu" id="crumb-menu-wrapper-${id}">
      <button
        type="button"
        class="${crumbMenuTriggerClassNames}"
        title="More"
        aria-haspopup="menu"
        id="${id}"
        aria-controls="${id}-menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="currentColor"
        >
          <path
            d="M480-93.85 253.85-320l42.77-42.77L480-180.15l183.38-182.62L706.15-320 480-93.85Zm-182.77-504L253.85-640 480-866.15 706.15-640l-43.38 42.15-182.77-182-182.77 182Z"
          />
        </svg>
      </button>
      <div class="crumb-menu-list-container" id="${id}-menu">
        <ol class="crumb-menu-list">
          ${menu
            .map(
              (m) => html`
                <li>
                  <a href="${m.href}" data-link>${m.label}</a>
                </li>
              `
            )
            .join('')}
        </ol>
      </div>
    </div>
  `;
};
