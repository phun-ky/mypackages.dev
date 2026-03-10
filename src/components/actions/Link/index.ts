export type LinkPropsType = {
  children: string;
  to: string;
  className?: string;
  style?: string;
};

export const Link = (props: LinkPropsType) => {
  const { children, to, className = '', style, ...rest } = props;
  let postfix = '';

  const attrs = Object.entries(rest)
    .map((attr) => {
      const [property, value] = attr;

      return ` ${property}="${value}"`;
    })
    .join(' ');
  const _style = style ? ` style="${style}"` : '';

  // external link
  if (to.indexOf('/') !== 0) {
    if (to.indexOf('#') === 0 || to.indexOf('mailto:') !== -1) {
      return `<a href="${to}" class="${className}"${attrs}${_style}>${children}</a>`;
    }

    // postfix = typeof children === 'string' ? ' (åpnes i ny fane)' : '';

    return `<a href="${to}" target="_blank" rel="noopener noreferrer" class="${className}"${attrs}${_style}>${children}${postfix}</a>`;
  }

  return `<a href="${to}" data-link="${to}" class="${className}"${attrs}${_style}>${children}</a>`;
};
