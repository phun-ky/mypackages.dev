import type { ComponentBasePropsType } from '../../../lib/spa/types';
import { cx } from '../../../utils/cx';
import './styles/container.css';

const html = String.raw;
export type ContainerPropsType = ComponentBasePropsType & {
  size?: 'small' | 'medium' | 'full';
};

export const Container = ({ children, size }: ContainerPropsType) => {
  const classNames = cx('container', {
    'is-small': size === 'small',
    'is-medium': size === 'medium',
    'is-full': size === 'full'
  });
  return html`<div class="${classNames}">${children}</div>`;
};
