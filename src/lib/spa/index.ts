/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint no-console:0 */
import { normalizeError } from '../../utils/error/normalize-error';

import type {
  FunctionType,
  EventArray,
  RouteDetails,
  StateContext,
  UseStateValue,
  UseStateReturn,
  RouterMatch,
  AppPageType
} from './types';
import { setTitle } from './utils/set-title';
import { updateNodes } from './utils/update-nodes';
import { waitFor } from './utils/wait-for';

/**
 * The main functionality that is to be replaced if a framework is to be used
 * instead. The functionality that spa provides, is the same principles and naming that React uses,
 * except for the global event handlers like `addOnClick`.
 */
export const spa = (() => {
  const _root: HTMLElement | null = document.querySelector('#app');

  if (!_root) {
    throw new Error(
      'Missing element for application! Please make sure you have an element with the id of `app` in the DOM'
    );
  }

  const stateHooks: Record<string, StateContext> = {};
  const effectHooks: any[] = [];

  let _templateCallback: AppPageType;
  let _page: RouterMatch;
  let clickEventArray: EventArray = [];
  let keyupEventArray: EventArray = [];
  let keydownEventArray: EventArray = [];
  let clickOutsideEventArray: EventArray = [];
  let inputEventArray: EventArray = [];
  let changeEventArray: EventArray = [];
  let onRouteChangeEventArray: FunctionType[] = [];
  let onAfterAppRenderEventArray: FunctionType[] = [];
  let effectIndex = 0;

  const init = async (
    templateCallback: AppPageType,
    routeDetails: RouteDetails
  ) => {
    document.getElementById('loader-container')?.classList.add('is-visible');

    if (!templateCallback) {
      throw new Error('Missing param `templateCallback` for `init()`');
    }

    if (!routeDetails) {
      throw new Error('Missing param `routeDetails` for `init()`');
    }

    const { page } = routeDetails;

    if (!page) {
      throw new Error('Missing page');
    }

    _templateCallback = templateCallback;
    _page = page;

    await render(routeDetails);
  };
  const render = async (routeDetails?: RouteDetails) => {
    let page = _page;
    let routeChanged = false;

    if (routeDetails) {
      page = routeDetails.page;
      routeChanged = routeDetails.routeChanged;
    }

    console.info(`trying to render "${page?.route?.name}"`);
    clickEventArray = [];
    // Pages add their handlers again on every render, so the old ones go
    // first: kept, they ran once more after each visit (#71)
    keyupEventArray = [];
    keydownEventArray = [];
    inputEventArray = [];
    changeEventArray = [];
    onRouteChangeEventArray = [];
    clickOutsideEventArray = [];
    onAfterAppRenderEventArray = [];
    // reset state indexes
    Object.keys(stateHooks).forEach(
      (context) => (stateHooks[context].index = 0)
    );

    effectIndex = 0;

    document.dispatchEvent(
      new CustomEvent('eventBeforeAppRender', {
        bubbles: true,
        cancelable: true
      })
    );

    let _html: string;

    try {
      _html = await _templateCallback({ match: page });
    } catch (e: unknown) {
      // Anything can be thrown, not only an Error (#109)
      if (normalizeError(e).message.includes('404')) {
        setTitle('404, page not found');
        _html = await _templateCallback({ match: 'PageNotFoundPage' });
      } else {
        _html = await _templateCallback({
          match: 'ErrorPage',
          error: e
        });

        console.error(e);
        console.info(
          `failed to render "${page?.route?.name}", rendering error page`
        );
      }
    }
    updateNodes(_root, _html);

    await waitFor(10);

    document.removeEventListener(
      'eventAfterRouteChanged',
      handleOnRouteChangedListener
    );
    document.addEventListener(
      'eventAfterRouteChanged',
      handleOnRouteChangedListener
    );

    if (routeChanged) {
      document.dispatchEvent(
        new CustomEvent('eventAfterRouteChanged', {
          bubbles: true,
          cancelable: true,
          detail: {
            routeDetails
          }
        })
      );
    }

    const onRender = () => {
      document.dispatchEvent(
        new CustomEvent(`eventAfterPage${page.route.name}Render`, {
          bubbles: true,
          cancelable: true
        })
      );

      document.dispatchEvent(
        new CustomEvent('eventAfterAppRender', {
          bubbles: true,
          cancelable: true
        })
      );
      document
        .getElementById('loader-container')
        ?.classList.remove('is-visible');
    };

    document.removeEventListener(
      'eventAfterAppRender',
      handleAfterAppRenderListeners
    );
    document.addEventListener(
      'eventAfterAppRender',
      handleAfterAppRenderListeners
    );

    onRender();

    document.removeEventListener('click', handleClickOutsideListeners);
    document.addEventListener('click', handleClickOutsideListeners);

    document.removeEventListener('click', handleClickListeners);
    document.addEventListener('click', handleClickListeners);

    document.removeEventListener('input', handleInputListeners);
    document.addEventListener('input', handleInputListeners);

    document.removeEventListener('change', handleChangeListeners);
    document.addEventListener('change', handleChangeListeners);

    document.removeEventListener('keyup', handleKeyupListeners);
    document.addEventListener('keyup', handleKeyupListeners);

    document.removeEventListener('keydown', handleKeydownListeners);
    document.addEventListener('keydown', handleKeydownListeners);
  };
  const handleAfterAppRenderListeners = () => {
    onAfterAppRenderEventArray.forEach(async (callback) => {
      await callback();
    });
  };
  const handleClickOutsideListeners = (e: Event) => {
    clickOutsideEventArray.forEach((target) => {
      const el = document.getElementById(target.id);

      if (!el) return;

      const targetElement = e.target;

      // Any element, so a click on an icon outside counts too (#71)
      if (!(targetElement instanceof Element)) return;

      if (!el.contains(targetElement)) {
        (target.callback as (e: Event, element: Element) => void)(e, el);
      }
    });
  };
  const handleOnRouteChangedListener = () => {
    onRouteChangeEventArray.forEach((callback) => callback());
  };
  /**
   * The element an event is for: the element with that id, or the nearest
   * one matching that selector, from the event's target outwards. A click on
   * an icon inside a button is a click on the button (#71).
   */
  const findElement = (e: Event, id: string): Element | null => {
    const target = e.target;

    if (!(target instanceof Element)) return null;

    const byId = document.getElementById(id);

    if (byId?.contains(target)) return byId;

    try {
      return target.closest(id);
    } catch {
      // An id that isn't a valid selector
      return null;
    }
  };
  /**
   * Calls each handler whose element the event is for, with the event and
   * that element.
   */
  const dispatch = (
    handlers: EventArray,
    e: Event,
    { preventDefault = false } = {}
  ) => {
    handlers.forEach((target) => {
      const element = findElement(e, target.id);

      if (!element) return;

      if (preventDefault) e.preventDefault();

      (target.callback as (e: Event, element: Element) => void)(e, element);
    });
  };
  const handleClickListeners = (e: Event) => dispatch(clickEventArray, e);
  const handleInputListeners = (e: Event) =>
    dispatch(inputEventArray, e, { preventDefault: true });
  const handleChangeListeners = (e: Event) =>
    dispatch(changeEventArray, e, { preventDefault: true });
  const handleKeydownListeners = (e: KeyboardEvent) =>
    dispatch(keydownEventArray, e);
  const handleKeyupListeners = (e: KeyboardEvent) =>
    dispatch(keyupEventArray, e);
  /**
   * To be able to add event listeners to the "string html" produced by the
   * components, we have to use "global" event handlers.
   * Every usages of this type of function (like `addOnClick`) is to be replaced if
   * a framework is used.
   * @param {string} id The id used for the event
   * @param {Function} callback The callback to use on the event
   */
  const addOnClick = (
    id: string,
    callback: (e: Event, element: Element) => void
  ) => {
    clickEventArray.push({ id, callback });
  };
  const addOnKeyup = (
    id: string,
    callback: (e: KeyboardEvent, element: Element) => void
  ) => {
    keyupEventArray.push({ id, callback });
  };
  const addClickOutside = (id: string, callback: (e: Event) => void) => {
    clickOutsideEventArray.push({ id, callback });
  };
  const addOnKeydown = (
    id: string,
    callback: (e: KeyboardEvent, element: Element) => void
  ) => {
    keydownEventArray.push({ id, callback });
  };
  const addOnInput = (id: string, callback: FunctionType) => {
    inputEventArray.push({ id, callback });
  };
  const addOnChange = (id: string, callback: (e: Event) => void) => {
    changeEventArray.push({ id, callback });
  };
  const addOnRouteChange = (callback: FunctionType) => {
    onRouteChangeEventArray.push(callback);
  };
  const addOnAfterAppRender = (callback: FunctionType) => {
    onAfterAppRenderEventArray.push(callback);
  };
  const useState = (
    initValue: UseStateValue,
    context: string
  ): UseStateReturn => {
    if (!context || typeof context !== 'string' || context === '') {
      throw new Error('Missing parameter `context` for `useState`');
    }

    if (!stateHooks[context]) {
      stateHooks[context] = { state: [], index: 0 };
    }

    const contextStateIndex = stateHooks[context].index;
    const state = (
      stateHooks[context].state[contextStateIndex] !== undefined
        ? stateHooks[context].state[contextStateIndex]
        : initValue
    ) as UseStateValue;
    const _contextStateIndex = contextStateIndex;
    const setState = (newValue: UseStateValue) => {
      if (stateHooks[context].state[_contextStateIndex] !== newValue) {
        stateHooks[context].state[_contextStateIndex] = newValue;
      }

      render();
    };

    stateHooks[context].index++;

    return [state, setState];
  };
  const useEffect = async (
    callback: unknown | Promise<FunctionType> | FunctionType,
    dependencyArray: any[]
  ) => {
    const oldDependencies = effectHooks[effectIndex];

    let hasChanged = true;

    if (oldDependencies) {
      hasChanged = dependencyArray.some(
        (dep: any, i: number) => !Object.is(dep, oldDependencies[i])
      );
    }

    effectHooks[effectIndex] = dependencyArray;
    effectIndex++;

    if (hasChanged && callback && typeof callback === 'function') {
      if (callback.constructor.name === 'AsyncFunction') {
        await callback();
      } else {
        callback();
      }
    }
  };

  return {
    addOnKeydown,
    addOnKeyup,
    addOnClick,
    addOnRouteChange,
    addOnInput,
    addOnChange,
    addClickOutside,
    addOnAfterAppRender,
    useEffect,
    useState,
    init,
    render
  };
})();

export const {
  addOnKeydown,
  addOnKeyup,
  addOnClick,
  addOnRouteChange,
  addOnInput,
  addOnChange,
  addClickOutside,
  addOnAfterAppRender,
  useEffect,
  useState,
  init,
  render
} = spa;

export default spa;
