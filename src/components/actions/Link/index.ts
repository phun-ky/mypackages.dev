import { escapeAttr } from '../../../utils/escape-html';

export type LinkPropsType = {
  children: string;
  to: string;
  className?: string;
  style?: string;
  /** For links without text, like icons */
  'aria-label'?: string;
};

export const Link = (props: LinkPropsType) => {
  const { children, to, className = '', style, ...rest } = props;
  // `to` and attribute values can hold data from npm, so escape them.
  // `children` is markup.
  const href = escapeAttr(to);
  const postfix = '';
  const attrs = Object.entries(rest)
    .map((attr) => {
      const [property, value] = attr;

      return ` ${property}="${escapeAttr(value)}"`;
    })
    .join(' ');
  const _style = style ? ` style="${escapeAttr(style)}"` : '';

  // external link
  if (to.indexOf('/') !== 0) {
    if (to.indexOf('#') === 0 || to.indexOf('mailto:') !== -1) {
      return `<a href="${href}" class="${className}"${attrs}${_style}>${children}</a>`;
    }

    // postfix = typeof children === 'string' ? ' (åpnes i ny fane)' : '';

    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="${className}"${attrs}${_style}>${children}${postfix}</a>`;
  }

  return `<a href="${href}" data-link="${href}" class="${className}"${attrs}${_style}>${children}</a>`;
};
