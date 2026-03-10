import { slugify } from '../../../utils/slugify';
import { Label } from '../Label';
import './styles/radioGroup.css';

const html = String.raw;

export type RadioGroupPropsType = {
  name: string;
  defaultChecked?: string;
  options: {
    id: string;

    label: string;
    value: string;
  }[];
};

export const RadioGroup = (props: RadioGroupPropsType) => {
  const { name, options, defaultChecked } = props;
  const idPrefix = slugify(name);
  return html`<span class="radio-group">
    ${options
      .map((option, idx) => {
        const { label, value, id } = option;
        const idToUse = `${idPrefix}-${slugify(id)}`;
        const checked = defaultChecked && idx === 0 ? ` checked ` : '';
        return html`<input
            type="radio"
            ${checked}
            name="${name}"
            id="${idToUse}"
            value="${value}"
          />
          ${Label({ labelFor: idToUse, label: label })}`;
      })
      .join('\n')}
  </span>`;
};
