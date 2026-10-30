/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from '@supabase/supabase-js';

// import './styles/tokenSettings.css';
import { setActiveProviderToken } from '../../../../../../../../features/profile/secrets/utils/set-active-provider-token';
import { addOnAfterAppRender } from '../../../../../../../../lib/spa';
import type { ComponentBasePropsType } from '../../../../../../../../lib/spa/types';
import { escapeAttr } from '../../../../../../../../utils/escape-html';

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
    const root = document.querySelector('.new-secret-page');

    if (!(root instanceof HTMLElement)) return;

    TokenSettings_bind(root, { supabase }, signal);
  });

  return html`<section
    class="user-card account-card token-settings"
    data-token-settings
    aria-labelledby="new-token-title"
  >
    <h2 id="new-token-title">Add a token</h2>
    <p>
      Create a read-only token on npmjs.com (Access Tokens, then a granular
      token with read access). It's stored encrypted in Supabase Vault, only
      used by the site's edge functions for your own requests, and never sent
      back to the browser.
    </p>

    <form class="account-form" data-token-form>
      <div class="account-field">
        <label for="token-provider">Provider</label>
        <select id="token-provider" name="provider" data-provider>
          <option value="npm" ${provider === 'npm' ? 'selected' : ''}>
            npm
          </option>
          <option value="github" ${provider === 'github' ? 'selected' : ''}>
            GitHub
          </option>
        </select>
      </div>

      <div class="account-field">
        <label for="token-label">Label</label>
        <input
          id="token-label"
          type="text"
          name="label"
          data-label
          maxlength="64"
          autocomplete="off"
          spellcheck="false"
          value="${escapeAttr(label)}"
          aria-describedby="token-label-help"
        />
        <p id="token-label-help">
          To tell your tokens apart, like laptop or work. Optional.
        </p>
      </div>

      <div class="account-field">
        <label for="token-secret">Token</label>
        <textarea
          id="token-secret"
          name="token"
          aria-required="true"
          rows="4"
          data-token
          maxlength="512"
          autocomplete="off"
          spellcheck="false"
        ></textarea>
      </div>

      <div class="account-row">
        <button type="submit" class="pill-button is-primary" data-submit>
          Save token
        </button>
        <div class="status" aria-live="polite" data-status></div>
      </div>
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
