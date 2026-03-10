import type { ComponentBasePropsType } from '../../../lib/spa/types';
import './styles/content.css';
const html = String.raw;
export type ContentPropsType = ComponentBasePropsType & {};

export const Content = ({ children }: ContentPropsType) => {
  return html`<section class="content">${children}</section>`;
};
