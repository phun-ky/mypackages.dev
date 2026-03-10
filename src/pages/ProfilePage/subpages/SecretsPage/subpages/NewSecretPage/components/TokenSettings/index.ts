/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-unused-modules */
import type { SupabaseClient } from '@supabase/supabase-js';

// import './styles/tokenSettings.css';
import { setActiveProviderToken } from '../../../../../../../../features/profile/secrets/utils/set-active-provider-token';
import { addOnAfterAppRender } from '../../../../../../../../lib/spa';
import type { ComponentBasePropsType } from '../../../../../../../../lib/spa/types';

const html = String.raw;

export type TokenProviderType = 'npm' | 'github';

export type TokenSettingsPropsType = ComponentBasePropsType & {
  supabase: SupabaseClient;
  defaultProvider?: TokenProviderType;
  defaultLabel?: string;
  signal?: AbortSignal;
};

export type StoreProviderTokenBodyType = {
  provider: TokenProviderType;
  label: string | null;
  token: string;
  meta?: Record<string, unknown>;
};

const escapeHtml = (s: string) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export const storeProviderToken = async (
  supabase: SupabaseClient,
  body: StoreProviderTokenBodyType,
  signal?: AbortSignal
) => {
  const {
    data: { session },
    error: sErr
  } = await supabase.auth.getSession();

  if (sErr) throw new Error(sErr.message);

  if (!session?.access_token) throw new Error('No session');

  const { data, error } = await supabase.functions.invoke('save-secret', {
    body,
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY.trim(),
      Authorization: `Bearer ${session.access_token.trim()}`
    },
    signal
  });

  if (error) throw new Error(`${error.message}`);

  if (!data?.ok) throw new Error('Token save failed.');

  return data as {
    ok: true;
    token: {
      id: string;
      provider: TokenProviderType;
      label: string | null;
      updated_at: string;
    };
  };
};

/**
 * Component: returns markup only (like your other components)
 */
export const TokenSettings = async (props: TokenSettingsPropsType) => {
  const { supabase, signal } = props;
  const provider = props.defaultProvider ?? 'npm';
  const label = props.defaultLabel ?? 'default';

  addOnAfterAppRender(() => {
    const root = document.querySelector('.profile-page');

    console.log('root', root);

    if (!(root instanceof HTMLElement)) return;

    TokenSettings_bind(root, { supabase }, signal);
  });

  return html`<section class="token-settings" data-token-settings>
    <h1>Secrets</h1>

    <p class="hint">
      Your secret is stored encrypted (Vault) and only used server-side via
      Supabase Edge Functions.
    </p>

    <form class="form" data-token-form>
      <div
        style="width: 100%;display:flex; gap: 1rem; justify-content: flex-start; align-items: flex-start;"
      >
        <div class="input-group" style="max-width: 320px;">
          <select name="provider" class="input" data-provider>
            <option value="npm" ${provider === 'npm' ? 'selected' : ''}>
              npm
            </option>
            <option value="github" ${provider === 'github' ? 'selected' : ''}>
              GitHub
            </option>
          </select>
          <label class="field"> Provider </label>
        </div>

        <div class="input-group">
          <input
            name="label"
            class="input"
            data-label
            autocomplete="off"
            spellcheck="false"
            value="${escapeHtml(label)}"
            placeholder="e.g. default, work, personal"
          />
          <label class="field"> Label (optional) </label>
        </div>
      </div>

      <div class="input-group" style="width: 100%;">
        <textarea
          name="token"
          aria-required="true"
          rows="9"
          data-token
          autocomplete="off"
          spellcheck="false"
          placeholder="Paste secret here"
        ></textarea>
        <label class="field"> Secret </label>
      </div>

      <button type="submit" class="button primary" data-submit>
        Save secret
      </button>

      <div class="status" aria-live="polite" data-status></div>
    </form>
  </section>`;
};

/**
 * Enhancer: call this after you mount/insert the HTML into the DOM.
 *
 * @example
 * const markup = await TokenSettings({ supabase }, signal);
 * root.innerHTML = markup;
 * TokenSettings_bind(root, { supabase });
 */
export const TokenSettings_bind = (
  root: HTMLElement,
  opts: { supabase: SupabaseClient },
  signal?: AbortSignal
) => {
  console.log('binding');

  const host = root.querySelector<HTMLElement>('[data-token-settings]');

  if (!host) return;

  const form = host.querySelector<HTMLFormElement>('[data-token-form]');
  const elProvider = host.querySelector<HTMLSelectElement>('[data-provider]');
  const elLabel = host.querySelector<HTMLInputElement>('[data-label]');
  const elToken = host.querySelector<HTMLTextAreaElement>('[data-token]');
  const elSubmit = host.querySelector<HTMLButtonElement>('[data-submit]');
  const elStatus = host.querySelector<HTMLElement>('[data-status]');

  if (!form || !elProvider || !elLabel || !elToken || !elSubmit || !elStatus)
    return;

  const setStatus = (kind: 'idle' | 'saving' | 'ok' | 'error', msg = '') => {
    host.dataset.state = kind;
    elStatus.textContent = msg;

    if (kind === 'saving') {
      elSubmit.disabled = true;
      elSubmit.textContent = 'Saving…';
    } else {
      elSubmit.disabled = false;
      elSubmit.textContent = 'Save token';
    }
  };

  setStatus('idle', '');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const provider = elProvider.value as TokenProviderType;
    const label = (elLabel.value ?? '').trim();
    const token = (elToken.value ?? '').trim();

    if (!token) {
      setStatus('error', 'Token cannot be empty.');

      return;
    }

    setStatus('saving', '');

    try {
      const res = await storeProviderToken(
        opts.supabase,
        {
          provider,
          label: label ? label : null,
          token,
          meta: {
            enteredAt: new Date().toISOString()
          }
        },
        signal
      );

      if (provider === 'npm') {
        await setActiveProviderToken(
          opts.supabase,
          { provider: 'npm', token_id: res.token.id },
          signal
        );
      }

      // Important: clear token from UI/memory
      elToken.value = '';
      setStatus('ok', 'Saved securely.');
    } catch (err: any) {
      setStatus('error', err?.message ?? 'Failed to save token.');
    }

    return false;
  });
};
