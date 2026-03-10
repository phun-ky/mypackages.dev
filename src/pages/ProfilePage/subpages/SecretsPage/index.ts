/* eslint-disable @typescript-eslint/no-explicit-any */
import { Container } from '../../../../components/layout/Container';
import { getActiveProviderTokenMeta } from '../../../../features/profile/secrets/utils/get-active-provider-token-meta';
import { listProviderTokens } from '../../../../features/profile/secrets/utils/list-provider-tokens';
import { setActiveProviderToken } from '../../../../features/profile/secrets/utils/set-active-provider-token';
import { addOnAfterAppRender } from '../../../../lib/spa';
import type { PagePropsType } from '../../../../lib/spa/types';
import { supabase } from '../../../../services/supabase';

const html = String.raw;

export type SecretsPagePropsType = PagePropsType;

export const SecretsPage = async (
  props: SecretsPagePropsType,
  signal: AbortSignal
) => {
  console.log(props, signal);

  const items = await listProviderTokens(supabase);
  const activeNpm = await getActiveProviderTokenMeta(
    supabase,
    { provider: 'npm' },
    signal
  );

  addOnAfterAppRender(() => {
    const root = document.querySelector('.secrets-page');

    if (!(root instanceof HTMLElement)) return;

    SecretsPage_bind(root, { signal });
  });

  return html`<section class="secrets-page" data-secrets-page>
    ${Container({
      size: 'small',
      children: html`<h1>Secrets</h1>`
    })}
    ${Container({
      size: 'small',
      children: html`
        <table>
          <thead>
            <th class="string">Label</th>
            <th class="string">Provider</th>
            <th class="string">Updated at</th>
            <th class="string"></th>
          </thead>
          <tbody>
            ${items
              .map((item) => {
                const { id, label, provider, updated_at } = item as any;
                const isActive =
                  provider === 'npm' && activeNpm?.token_id === id;

                return html`<tr
                  data-row
                  data-id="${id}"
                  data-provider="${provider}"
                >
                  <td>
                    ${label ?? ''}
                    ${isActive
                      ? html` <span class="badge" data-active>Active</span>`
                      : ''}
                  </td>
                  <td>${provider}</td>
                  <td>${updated_at}</td>
                  <td>
                    ${provider === 'npm'
                      ? html`<button
                          type="button"
                          class="button"
                          data-make-active
                          data-token-id="${id}"
                          ${isActive ? 'disabled' : ''}
                        >
                          ${isActive ? 'Active' : 'Use for npm'}
                        </button>`
                      : ''}
                  </td>
                </tr>`;
              })
              .join('\n')}
          </tbody>
        </table>

        <div class="status" aria-live="polite" data-status></div>
      `
    })}
  </section>`;
};

export const SecretsPage_bind = (
  root: HTMLElement,
  opts: { signal?: AbortSignal }
) => {
  const status = root.querySelector<HTMLElement>('[data-status]');
  const setStatus = (msg: string) => {
    if (!status) return;

    status.textContent = msg;
  };

  root.addEventListener('click', async (e) => {
    const t = e.target as HTMLElement;
    const btn = t.closest<HTMLButtonElement>('[data-make-active]');

    if (!btn) return;

    const tokenId = btn.dataset.tokenId ?? '';

    if (!tokenId) return;

    btn.disabled = true;
    setStatus('Setting active npm token…');

    try {
      await setActiveProviderToken(
        supabase,
        { provider: 'npm', token_id: tokenId },
        opts.signal
      );

      // simplest + robust: reload route
      window.location.reload();
    } catch (err: any) {
      btn.disabled = false;
      setStatus(err?.message ?? 'Failed to set active token.');
    }
  });
};
