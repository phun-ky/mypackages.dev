import type { BreadcrumbItem } from './utils/get-breadcrumbs';

import './styles/breadcrumbs.css';

import { CrumbMenu } from './CrumbMenu';

const html = String.raw;

export type BreadcrumbsPropsType = {
  items: BreadcrumbItem[];
};

export const Breadcrumbs = (props: BreadcrumbsPropsType) => {
  const { items } = props;
  if (!items.length) return '';

  return html`
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <ol class="breadcrumbs-list">
        ${items
          .map(
            (c) => html`
              <li class="crumb ${c.isCurrent ? 'is-current' : ''}">
                <a
                  href="${c.href}"
                  data-crumb-id="${c.id}"
                  data-link
                  ${c.isCurrent ? 'aria-current="page"' : ''}
                  class="${c.className}"
                >
                  ${c.icon ?? ''}${c.label}
                </a>

                ${CrumbMenu({ menu: c.menu, id: c.id })}
              </li>
            `
          )
          .join('\n')}
      </ol>
    </nav>
  `;
};
