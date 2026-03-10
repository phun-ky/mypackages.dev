export const eventMatches = (
  event: Event,
  selector: string
): HTMLElement | undefined => {
  // <svg> in IE does not have `Element#msMatchesSelector()` (that should be copied to `Element#matches()` by a polyfill).
  // Also a weird behavior is seen in IE where DOM tree seems broken when `event.target` is on <svg>.
  // Therefore this function simply returns `undefined` when `event.target` is on <svg>.
  const { target, currentTarget } = event;

  if (!(target instanceof HTMLElement)) return undefined;

  if (typeof target.matches === 'function') {
    if (target.matches(selector)) {
      // If event target itself matches the given selector, return it
      return target;
    }

    if (
      !(currentTarget instanceof Document) &&
      !(currentTarget instanceof HTMLElement)
    ) {
      return undefined;
    }

    const container =
      currentTarget instanceof Document
        ? currentTarget.documentElement
        : currentTarget;

    if (target.matches(`${selector} *`)) {
      const closest = target.closest(selector);

      if (closest && container.contains(closest)) {
        return closest as HTMLElement;
      }
    }
  }

  return undefined;
};
