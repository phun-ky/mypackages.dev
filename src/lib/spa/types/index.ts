import type { Session } from '@supabase/supabase-js';

import type { Config } from '../../../types';

export type PagePropsType = {
  match?: RouterMatch | string;
  username?: string;
  session?: Session | null;
  error?: Error;
  returnTo?: string;
  options: Config;
  packageName?: string;
};

export type ComponentBasePropsType = {
  children?: string;
};

export type AppPageType =
  | ((props: Partial<PagePropsType>) => string)
  | ((props: Partial<PagePropsType>) => Promise<string>);

export type FunctionType =
  | ((...args: unknown[]) => void)
  | ((...args: unknown[]) => Promise<void>);

export type FunctionReturnStringType = (...args: unknown[]) => string;

export type EventDataId = {
  id: string;
  callback: EventDataAction;
};

export type EventDataAction =
  | ((e: KeyboardEvent) => void)
  | ((e: Event) => void)
  | FunctionType
  | FunctionReturnStringType;

export type EventDataSelector = {
  selector: string;

  callback: EventDataAction;
};

export type EventDataUnion<T> = FunctionType | FunctionReturnStringType | T;

export type EventArray = EventDataId[];

export type UseStateValue =
  | boolean
  | string
  | number
  | unknown[]
  | Record<string, unknown>;

export type UseStateReturn = [UseStateValue, (newValue: UseStateValue) => void];

export type StateContext = {
  state: UseStateValue[];
  index: number;
};

/**
 * Represents the event object for an element.
 * @template T - Type of the element used as a target.
 */
export type EventType<T> = Event & {
  target: T & {
    files?: FileList | null;
    id: string;
    parentElement: Element | null;
    value?: string | null;
  };
  offsetX?: number;
  offsetY?: number;
  currentTarget: HTMLElement & {
    documentElement: HTMLElement;
  };
};

/**
 * Represents the mouse event object for an element.
 * @template T - Type of the element used as a target.
 */
export type MouseEventType<T> = MouseEvent & {
  target: T & {
    files?: FileList | null;
    id: string;
    parentElement: Element | null;
    value?: string | null;
  };
  offsetX?: number;
  offsetY?: number;
  currentTarget: HTMLElement & {
    documentElement: HTMLElement;
  };
};

/**
 * Represents the keyboard event object for an element.
 * @template T - Type of the element used as a target.
 */
export type KeyboardEventType<T> = KeyboardEvent & {
  target: T & {
    id: string;
  };
  currentTarget: HTMLElement & {
    documentElement: HTMLElement;
  };
};

export type NavigateToEvent = CustomEvent<{ to: string }>;

export type PreviousRoute = {
  name: string;
};

export type Route = {
  name: string;
  path?: string;
  page?: string;
  regex?: RegExp;
  public?: boolean;
  layout?: string;
};

export type Routes = Route[];

export type RouteDetails = {
  page: RouterMatch;
  previousPage: RouterMatch;
  previousParams: unknown;
  currentParams: unknown;
  paramsChanged: boolean;
  routeChanged: boolean;
};

export type RouterMatch = {
  route: Route;
  result?: RegExpMatchArray | null;
};
