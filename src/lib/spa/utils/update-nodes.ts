import { DiffDOM, nodeToObj } from 'diff-dom';

/**
 * A wrapper to be able to update DOM nodes, using the 3rd party library `diff-dom`.
 * This compares the old DOM nodes with the new DOM nodes and applies any changes.
 * It is the same modus operandi as the inner working of a modern-day JS framework, e.g., React.
 *
 * The `updateNodes` function takes two parameters: `root` and `html`.
 * The root parameter is an `HTMLElement` where the DOM changes
 * will be applied, and the `html` parameter is a string representing
 * the new DOM nodes to be applied.
 *
 * The function uses the third-party library `diff-dom` to compare
 * the old DOM nodes with the new DOM nodes and apply any changes,
 * simulating the behavior of modern JS frameworks like React.
 * The `updateNodes` function does not return anything (returns `void`).
 *
 *
 *
 * **NOTE:** Does not detect text changes. See [fiduswriter/diffDOM#advanced-merging-of-text-node-changes](https://github.com/fiduswriter/diffDOM#advanced-merging-of-text-node-changes)
 *
 *
 *
 * @see [diffDOM](https://github.com/fiduswriter/diffDOM)
 * @param {HTMLElement} root - The root HTMLElement where the DOM changes will be applied.
 * @param {string} html - The HTML string representing the new DOM nodes to be applied.
 * @returns {void} - This function does not return anything (returns void).
 *
 * @example
 * ```ts
 * const rootElement = document.getElementById('app');
 * const newHTML = App();
 * // Updates only the changed DOM elements
 * updateNodes(rootElement, newHTML);
 * ```
 */
export const updateNodes = (root: HTMLElement, html: string): void => {
  // Parsed by the browser, not diff-dom's own parser, which kept entities
  // like &#39; as text and didn't close an end tag split over two lines,
  // as Prettier writes them in long templates (#64). A template's content
  // is inert: nothing in it loads or runs until it's applied.
  const template = document.createElement('template');

  template.innerHTML = `<div class="app">${html}</div>`;

  const currentDOM = nodeToObj(root);
  const newDOM = nodeToObj(template.content.firstElementChild as HTMLElement);
  const dd = new DiffDOM({ valueDiffing: false });
  const diff = dd.diff(currentDOM, newDOM);

  dd.apply(root, diff);
};
