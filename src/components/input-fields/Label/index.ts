import type { ComponentBasePropsType } from '../../../lib/spa/types';

const html = String.raw;

export type LabelPropsType = ComponentBasePropsType & {
  labelFor: string;
  label: string;
  className?: string;
};

export const Label = (props: LabelPropsType) => {
  const { labelFor, label, className = '' } = props;

  return html`<label class="label ${className}" for="${labelFor}">
    ${label}
  </label>`;
};
