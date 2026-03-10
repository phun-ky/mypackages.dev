import { Link } from '../../actions/Link';
import './styles/card.css';
import { addOnAfterAppRender } from '/lib/spa';

const html = String.raw;

export type CardPropsType = {
  children: string;
  to?: string;
  className?: string;
};

export const Card = (props: CardPropsType) => {
  const { children, to, className } = props;

  addOnAfterAppRender(() => {
    //promise should be fullfille here, so we do not block render
  });

  if (to) {
    return html`${Link({
      to,
      children: html`${children}`,
      className: `card ${className ?? ''}`
    })}`;
  }

  return html`<div class="card ${className ?? ''}">${children}</div>`;
};
