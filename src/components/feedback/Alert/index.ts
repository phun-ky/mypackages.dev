import { cx } from '../../../utils/cx';
import './styles/alert.css';

export type AlertPropsType = {
  title?: string;
  size?: 'wide';
  description: string;
  className?: string;
  type?: 'neutral' | 'note' | 'tip' | 'important' | 'warning' | 'caution';
};

const html = String.raw;

export const Alert = (props: AlertPropsType) => {
  const { title, description, className = '', type = 'neutral', size } = props;
  const classNames = cx(`alert ${type} ${className}`, {
    [`${size}`]: Boolean(size)
  });

  return html`<div class="${classNames}">
    ${title && title !== '' ? `<span class="title">${title}</span>` : ''}
    ${description}
  </div>`;
};
