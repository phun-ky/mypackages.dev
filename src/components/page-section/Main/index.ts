import type { ComponentBasePropsType } from '../../../lib/spa/types';
import './styles/main.css';

const html = String.raw;

export type MainPropsType = ComponentBasePropsType;

export const Main = ({ children }: MainPropsType) =>
  html`<main class="main" id="main" tabindex="-1">${children}</main>`;
