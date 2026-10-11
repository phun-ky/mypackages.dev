import { cx } from '../../../utils/cx';
import './styles/alert.css';

export type AlertPropsType = {
  title?: string;
  size?: 'wide';
  description: string;
  className?: string;
  type?: 'neutral' | 'note' | 'tip' | 'important' | 'warning' | 'caution';
  /** Makes the alert a labelled landmark, for alerts outside `<main>` */
  label?: string;
};

const html = String.raw;

export const Alert = (props: AlertPropsType) => {
  const {
    title,
    description,
    className = '',
    type = 'neutral',
    size,
    label
  } = props;
  const classNames = cx(`alert ${type} ${className}`, {
    [`${size}`]: Boolean(size)
  });
  const landmark = label ? ` role="region" aria-label="${label}"` : '';

  return html`<div class="${classNames}" ${landmark}>
    ${title && title !== '' ? `<span class="title">${title}</span>` : ''}
    ${description}
  </div>`;
};
