import { addOnAfterAppRender } from '../../../lib/spa';

import { createTableOfContents } from './utils/init';
import './styles/tableOfContents.css';

const html = String.raw;

export const TableOfContents = () => {
  addOnAfterAppRender(() => {
    const tocElement = document.getElementById('toc');

    if (!(tocElement instanceof HTMLElement)) return;

    tocElement.innerHTML = createTableOfContents() as string;
  });

  return html`<aside class="table-of-contents">
    <h2>Table of Contents</h2>
    <div id="toc"></div>
  </aside>`;
};
