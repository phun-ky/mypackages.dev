import type { ComponentBasePropsType } from '../../../lib/spa/types';
import './styles/checkbox.css';

const html = String.raw;

export type CheckboxPropsType = ComponentBasePropsType & {
  checked?: boolean;
  name: string;
  id: string;
  className?: string;
};

export const Checkbox = (props: CheckboxPropsType) => {
  const { checked = false, name, id, className = 'ph' } = props;
  const checkedAttribute = checked ? 'checked="checked"' : '';

  return html`<input
    type="checkbox"
    ${checkedAttribute}
    name="${name}"
    id="${id}"
    class="${className}"
  />`;
};
