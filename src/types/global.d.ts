export {};

declare global {
  // adds a typed global variable: globalThis.activeElement
  var activeElement: Element | null;

  interface DocumentEventMap {
    navigateTo: CustomEvent<{ to: string }>;
  }
}
