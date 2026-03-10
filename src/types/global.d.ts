export {};

declare global {
  // adds a typed global variable: globalThis.activeElement
  var activeElement: Element | null;
  interface Window {
    __onHeaderScroll: any;
  }
  interface DocumentEventMap {
    navigateTo: CustomEvent<{ to: string }>;
  }
}
