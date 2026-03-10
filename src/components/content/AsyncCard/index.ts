/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from '../../actions/Link';
import { addOnAfterAppRender } from '/lib/spa';

import './styles/asyncCard.css';

const html = String.raw;

export type CardAsyncProps<T> = {
  data?: Promise<T>;
  render?: (data: T) => string;
  fallback?: string;
  isLoading?: boolean;
  onError?: (error: unknown) => string;

  /**
   * If aborted, Card will not swap in resolved content (and will ignore errors).
   * If your `data` comes from fetch, make sure the fetch uses this signal too.
   */
  signal?: AbortSignal;
};

export type CardPropsType<T = unknown> = {
  children?: string;
  to?: string;
  className?: string;
} & CardAsyncProps<T>;

const defaultSkeleton = html`
  <div class="card__skeleton" aria-busy="true" aria-live="polite">
    <div class="skeleton-line"></div>
    <div class="skeleton-line"></div>
    <div class="skeleton-line short"></div>
  </div>
`;
const defaultError = (e?: unknown) => {
  console.error(e);

  return html`<div class="card__error" role="alert">
    Something went wrong.
  </div>`;
};
const isPromiseLike = (v: unknown): v is Promise<unknown> =>
  !!v &&
  typeof v === 'object' &&
  'then' in (v as any) &&
  typeof (v as any).then === 'function';

export const Card = <T>(props: CardPropsType<T>) => {
  const {
    children,
    to,
    className,
    data,
    render,
    fallback,
    isLoading,
    signal,
    onError
  } = props;
  const loadingUI = fallback ?? defaultSkeleton;
  const mountId = `card-${crypto.randomUUID()}`;
  const shouldAsyncSwap =
    !isLoading && data && isPromiseLike(data) && typeof render === 'function';
  const initialInner = (() => {
    if (isLoading) return loadingUI;

    return children ?? '';
  })();
  const inner = html`<div id="${mountId}" class="card__inner">
    ${initialInner}
  </div>`;

  if (shouldAsyncSwap) {
    addOnAfterAppRender(() => {
      // If already aborted, do nothing.
      if (signal?.aborted) return;

      void (async () => {
        const host = document.getElementById(mountId);

        if (!host) return;

        // Optional: if aborted later, we should also bail out before DOM updates.
        const isDead = () =>
          signal?.aborted || !document.getElementById(mountId);

        try {
          const resolved = await data;

          if (isDead()) return;

          const stillThere = document.getElementById(mountId);

          if (!stillThere) return;

          stillThere.innerHTML = render(resolved);
        } catch (e) {
          // Ignore abort-related errors (common: AbortError from fetch)
          if (signal?.aborted) return;

          if ((e as any)?.name === 'AbortError') return;

          if (isDead()) return;

          const stillThere = document.getElementById(mountId);

          if (!stillThere) return;

          stillThere.innerHTML = (onError ?? defaultError)(e);
        }
      })();
    });
  }

  const content = html`<div class="card ${className ?? ''}">${inner}</div>`;

  if (to) {
    return html`${Link({
      to,
      children: content,
      className: ''
    })}`;
  }

  return content;
};
