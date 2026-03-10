import { cx } from '../../../utils/cx';
import './styles/button.css';

const html = String.raw;

export type ButtonPropsType = {
  className?: string;
  id?: string;
  type?: 'submit' | 'button';
  disabled?: boolean;
  children?: string;
};

export const Button = ({
  id,
  className,
  type = 'button',
  disabled = false,
  children
}: ButtonPropsType) => {
  const buttonClassName = cx(className);
  const attrs = disabled ? ' disabled ' : '';

  return html`<button
    type="${type}"
    ${attrs}
    class="button ${buttonClassName}"
    ${id ? html`id="${id}"` : ''}
  >
    ${children ?? ''}
  </button>`;
};
