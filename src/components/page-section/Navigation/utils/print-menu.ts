import type { NavigationItem } from '..';
import { cx } from '../../../../utils/cx';
import { Link } from '../../../actions/Link';
import { isItemActive } from './is-item-active';

const html = String.raw;

export const printMenu = (
  items: NavigationItem[],
  currentPath: string,
  sub: boolean = false
): string => {
  const navigationListClassNames = cx('navigation-list', {
    sub
  });
  return html`<ul class="${navigationListClassNames}">
    ${items
      .map((item) => {
        const { path, name, itemClassName, actionClassName, children, icon } =
          item;
        const active = isItemActive(item, currentPath);
        const hasChildren = Boolean(children && children.length);

        const listItemClassNames = cx(`navigation-list-item ${itemClassName}`, {
          'is-parent': hasChildren,
          'is-active': active
        });
        const listActionClassNames = cx(
          `navigation-list-action ${actionClassName}`
        );
        if (!path || (path && path === '')) {
          return html`<li class="${listItemClassNames}">
            <button
              type="button"
              data-toggle-menu
              class="${listActionClassNames}"
            >
              ${icon ? icon : ''} <span class="label">${name}</span>
              ${hasChildren
                ? html`<svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 -960 960 960"
                  >
                    <path d="M480-360 280-560h400z" />
                  </svg>`
                : ''}
            </button>
            ${children ? printMenu(children, currentPath, true) : ''}
          </li>`;
        }
        return html`<li class="${listItemClassNames}">
          ${Link({
            to: path,
            children: html`${icon ? icon : ''}
              <span class="label">${name}</span>`,
            className: listActionClassNames
          })}
          ${children ? printMenu(children, currentPath, true) : ''}
        </li>`;
      })
      .join('\n')}
  </ul>`;
};
