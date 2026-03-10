import DOMPurify from 'dompurify';

import { slugify } from '../../../../utils/slugify';

const html = String.raw;

export const createTableOfContents = () => {
  const tocElement = document.getElementById('toc');

  if (!tocElement) return;

  let level = 0;

  const headings = document.querySelectorAll(
    'main h2, main h3, main h4, main h5, main h6'
  );

  let toc = '';

  [...headings].forEach((heading) => {
    if (!(heading instanceof HTMLElement)) return;

    const title = heading.textContent?.trim() ?? '';
    const anchor = slugify(title);

    heading.setAttribute('id', anchor);

    const openLevel = Number(heading.tagName.slice(1));

    if (openLevel > level) {
      toc += new Array(openLevel - level + 1).join('<ol>');
    } else if (openLevel < level) {
      toc += new Array(level - openLevel + 1).join('</ol>');
    }

    level = openLevel;
    toc += html`<li>
      <a href="#${anchor}"> ${title} </a>
    </li>`;
  });

  if (level) {
    toc += new Array(level + 1).join('</ol>');
  }

  return DOMPurify.sanitize(toc);
};
