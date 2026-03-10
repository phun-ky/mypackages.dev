/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-unused-modules */
/* eslint no-console:0 */
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

  const keyupEventArray: EventArray = [];
  const keydownEventArray: EventArray = [];

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

    let _html = '';

    try {
      _html = await _templateCallback({ match: page });
    } catch (e: unknown) {
      if ((e as Error).message.indexOf('404') !== -1) {
        setTitle('404, page not found');
        _html = '<h1>404, page not found</h1>';
      } else {
        _html = await _templateCallback({
          match: 'ErrorPage',

          error: e as Error
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

      if (!(targetElement instanceof HTMLElement)) return;

      if (!el.contains(targetElement)) {
        target.callback(e as any);
      }
    });
  };
  const handleOnRouteChangedListener = () => {
    onRouteChangeEventArray.forEach((callback) => callback());
  };
  const handleClickListeners = (e: Event) => {
    const targetElement = e.target;

    if (!(targetElement instanceof HTMLElement)) return;

    clickEventArray.forEach((target) => {
      if (targetElement.id === target.id || targetElement.matches(target.id)) {
        target.callback(e as any);
      }
    });
  };
  const handleInputListeners = (e: Event) => {
    const targetElement = e.target;

    if (!(targetElement instanceof HTMLElement)) return;

    inputEventArray.forEach((target) => {
      if (targetElement.id === target.id || targetElement.matches(target.id)) {
        e.preventDefault();
        target.callback(e as any);
      }
    });
  };
  const handleChangeListeners = (e: Event) => {
    const targetElement = e.target;

    if (!(targetElement instanceof HTMLElement)) return;

    changeEventArray.forEach((target) => {
      if (targetElement.id === target.id || targetElement.matches(target.id)) {
        e.preventDefault();
        target.callback(e as any);
      }
    });
  };
  const handleKeydownListeners = (e: KeyboardEvent) => {
    const targetElement = e.target;

    if (!(targetElement instanceof HTMLElement)) return;

    keydownEventArray.forEach((target) => {
      if (targetElement.id === target.id) {
        target.callback(e);
      }
    });
  };
  const handleKeyupListeners = (e: KeyboardEvent) => {
    const targetElement = e.target;

    if (!(targetElement instanceof HTMLElement)) return;

    keyupEventArray.forEach((target) => {
      if (targetElement.id === target.id) {
        target.callback(e);
      } else if (targetElement.matches(target.id)) {
        target.callback(e);
      } else if (targetElement.matches(`${target.id} *`)) {
        const closest = targetElement.closest(target.id);
        const currentTarget = e.target;

        if (!(currentTarget instanceof HTMLElement)) return;

        if (
          (currentTarget.nodeType === Node.DOCUMENT_NODE
            ? (currentTarget as unknown as Document).documentElement
            : currentTarget
          ).contains(closest)
        ) {
          target.callback(e);
        }
      }
    });
  };
  /**
   * To be able to add event listeners to the "string html" produced by the
   * components, we have to use "global" event handlers.
   * Every usages of this type of function (like `addOnClick`) is to be replaced if
   * a framework is used.
   * @param {string} id The id used for the event
   * @param {Function} callback The callback to use on the event
   */
  const addOnClick = (id: string, callback: (e: Event) => void) => {
    clickEventArray.push({ id, callback });
  };
  const addOnKeyup = (id: string, callback: (e: KeyboardEvent) => void) => {
    keyupEventArray.push({ id, callback });
  };
  const addClickOutside = (id: string, callback: (e: Event) => void) => {
    clickOutsideEventArray.push({ id, callback });
  };
  const addOnKeydown = (id: string, callback: (e: KeyboardEvent) => void) => {
    keyupEventArray.push({ id, callback });
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
