const html = String.raw;

import type { ComponentBasePropsType } from '../../../lib/spa/types';
import { Checkbox } from '../Checkbox';
import { Label } from '../Label';
import './styles/toggleBox.css';

export type ToggleBoxPropsType = ComponentBasePropsType & {
  checked?: boolean;
  name: string;
  id: string;
  className?: string;
  label: string;
};

export const ToggleBox = (props: ToggleBoxPropsType) => {
  const { checked = false, name, id, className = '', label } = props;

  return html`<div class="toggle-controls">
    ${Checkbox({ checked, name, id, className: `toggle ${className}` })}
    ${Label({ labelFor: id, label: label })}
  </div>`;
};
