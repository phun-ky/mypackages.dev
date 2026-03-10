/* eslint-disable @stylistic/indent */

import { supabase } from '../../services/supabase';
import { fetchEnsuredPackages } from '../../services/supabase/utils/fetch-ensured-package';
import { normalizePackageName } from '../../utils/package/normalize-package-name';

export type EnsuredRow = {
  id: number;
  package_name: string;
  registry: 'npm' | 'github';
};

const html = String.raw;

type EnsureResponse =
  | { ok: true; code: 'INSERTED'; row: EnsuredRow; message: string }
  | {
      ok: true;
      code: 'ALREADY_EXISTS';
      message: string;
      packageName: string;
      registry: 'npm' | 'github';
    }
  | {
      ok: false;
      code?: 'NOT_FOUND';
      message?: string;
      error?: string;
      packageName?: string;
      registry?: 'npm' | 'github';
    };

const setStatus = (
  statusEl: HTMLElement,
  kind: 'idle' | 'checking' | 'ok' | 'warn' | 'error',
  msg = ''
) => {
  statusEl.innerHTML = msg;
  statusEl.setAttribute('data-kind', kind);
};
const ensurePackage = async (
  raw: string,
  registry: 'npm' | 'github' = 'npm'
): Promise<EnsureResponse> => {
  const packageName = normalizePackageName(raw);
  const { data, error } = await supabase.functions.invoke<EnsureResponse>(
    'ensure_package',
    { body: { packageName, registry } }
  );

  console.log('ensurePackage', data, error);

  if (error) return { ok: false, error: error.message };

  return data as EnsureResponse;
};
const deleteEnsuredPackage = async (id: number, signal: AbortSignal) => {
  const { error } = await supabase
    .from('ensured_packages')
    .delete()
    .eq('id', id)
    .abortSignal(signal);

  if (error) throw error;
};
const renderExistingRow = (row: EnsuredRow) => {
  const wrap = document.createElement('div');

  wrap.className = 'input-group horizontal package-entry is-existing';
  wrap.dataset.id = String(row.id);

  // input
  const input = document.createElement('input');

  input.type = 'text';
  input.value = row.package_name;
  input.disabled = true;

  // remove button
  const btn = document.createElement('button');

  btn.type = 'button';
  btn.classList.add('button', 'danger', 'remove');
  btn.innerHTML = html`<svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 -960 960 960"
    >
      <path
        d="M292.31-140q-29.92 0-51.12-21.19Q220-182.39 220-212.31V-720h-40v-60h180v-35.38h240V-780h180v60h-40v507.69Q740-182 719-161t-51.31 21zM680-720H280v507.69q0 5.39 3.46 8.85t8.85 3.46h375.38q4.62 0 8.46-3.85 3.85-3.84 3.85-8.46zM376.16-280h59.99v-360h-59.99zm147.69 0h59.99v-360h-59.99zM280-720v520z"
      /></svg
    >Remove`;

  // status
  const status = document.createElement('span');

  status.className = 'status';

  wrap.append(input, btn, status);

  return wrap;
};
const cloneNewEntryRow = (template: HTMLElement) => {
  const clone = template.cloneNode(true) as HTMLElement;

  clone.classList.remove('is-existing');
  clone.classList.add('is-new');
  clone.removeAttribute('data-id');

  const input = clone.querySelector('input') as HTMLInputElement | null;
  const btn = clone.querySelector('button, .button, input[type="submit"]') as
    | HTMLButtonElement
    | HTMLElement
    | null;
  const status = clone.querySelector('.status') as HTMLElement | null;

  if (input) {
    input.value = '';
    input.disabled = false;
  }

  if (status) setStatus(status, 'idle', '');

  // Make sure the button has the correct class/text
  if (btn) {
    btn.classList.remove('remove', 'danger');
    btn.classList.add('register');

    if (btn instanceof HTMLButtonElement) btn.disabled = false;

    // If your Button component renders <button>, this works:
    if (btn instanceof HTMLButtonElement) btn.textContent = 'Register';
    else btn.textContent = 'Register';
  }

  return clone;
};

/**
 * Mount ensured packages behavior inside the profile page.
 * Call this AFTER the ProfilePage HTML has been inserted into the DOM.
 */
export const mountEnsuredPackages = async (
  root: HTMLElement,
  signal: AbortSignal
) => {
  const form = root.querySelector('.ensured-packages') as HTMLElement | null;

  if (!form) return;

  const list = form.querySelector('.package-entries') as HTMLElement | null;

  if (!list) return;

  // This is your existing "new package" row in the markup
  const templateRow = form.querySelector(
    '.input-group.horizontal.package-entry'
  ) as HTMLElement | null;

  if (!templateRow) return;

  // Ensure template row has .register on its button (recommended)
  const templateBtn = templateRow.querySelector(
    'button, .button, input[type="submit"]'
  ) as HTMLElement | null;

  if (templateBtn && !templateBtn.classList.contains('register')) {
    // best effort: add the class so delegation works
    templateBtn.classList.add('register');
  }

  templateRow.classList.add('is-new');

  // 1) Load and render existing ensured packages into .package-entries
  const existing = await fetchEnsuredPackages(signal);

  list.innerHTML = '';
  for (const row of existing) list.appendChild(renderExistingRow(row));

  // 2) Event delegation (register/remove)
  form.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement | null;

    if (!target) return;

    const rowEl = target.closest('.package-entry') as HTMLElement | null;

    if (!rowEl) return;

    const input = rowEl.querySelector('input') as HTMLInputElement | null;
    const status = rowEl.querySelector('.status') as HTMLElement | null;

    if (!input || !status) return;

    // REGISTER
    if (target.classList.contains('register')) {
      const raw = input.value;
      const normalized = normalizePackageName(raw);

      if (!normalized) {
        setStatus(status, 'error', 'Please enter a package name');

        return;
      }

      setStatus(status, 'checking', 'Checking…');
      input.disabled = true;

      if (target instanceof HTMLButtonElement) target.disabled = true;

      const res = await ensurePackage(raw, 'npm');

      if (!res.ok) {
        const msg =
          res.code === 'NOT_FOUND'
            ? (res.message ?? 'Package not found (typo?)')
            : (res.error ?? res.message ?? 'Could not register');

        console.log('msg', res.code, msg, res.error, res.message);

        setStatus(status, 'error', msg);
        input.disabled = false;

        if (target instanceof HTMLButtonElement) target.disabled = false;

        return;
      }

      if (res.code === 'ALREADY_EXISTS') {
        setStatus(status, 'warn', 'Already registered');
        input.disabled = false;

        if (target instanceof HTMLButtonElement) target.disabled = false;

        return;
      }

      // INSERTED: convert current row into an "existing" row UI
      setStatus(
        status,
        'ok',
        '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M382-253.85 168.62-467.23 211.38-510 382-339.38 748.62-706l42.76 42.77L382-253.85Z"/></svg>'
      );
      rowEl.classList.remove('is-new');
      rowEl.classList.add('is-existing');
      rowEl.dataset.id = String(res.row.id);

      input.value = res.row.package_name;
      input.disabled = true;

      // turn button into Remove
      target.classList.remove('register');
      target.classList.add('button', 'danger', 'remove');
      target.innerHTML = html`<svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 -960 960 960"
        >
          <path
            d="M292.31-140q-29.92 0-51.12-21.19Q220-182.39 220-212.31V-720h-40v-60h180v-35.38h240V-780h180v60h-40v507.69Q740-182 719-161t-51.31 21zM680-720H280v507.69q0 5.39 3.46 8.85t8.85 3.46h375.38q4.62 0 8.46-3.85 3.85-3.84 3.85-8.46zM376.16-280h59.99v-360h-59.99zm147.69 0h59.99v-360h-59.99zM280-720v520z"
          />
        </svg>
        Remove`;

      if (target instanceof HTMLButtonElement) target.disabled = false;

      // append a new blank row (clone the template row)
      const fresh = cloneNewEntryRow(templateRow);

      // IMPORTANT: append after the converted row (i.e. at the end of the form)
      rowEl.parentElement?.insertBefore(fresh, rowEl.nextSibling);

      (fresh.querySelector('input') as HTMLInputElement | null)?.focus();

      return;
    }

    // REMOVE
    if (target.classList.contains('remove')) {
      const id = Number(rowEl.dataset.id);

      if (!id) return;

      setStatus(status, 'checking', 'Removing…');

      if (target instanceof HTMLButtonElement) target.disabled = true;

      try {
        await deleteEnsuredPackage(id, signal);
        rowEl.remove();
      } catch (err) {
        setStatus(
          status,
          'error',
          err instanceof Error ? err.message : 'Remove failed'
        );

        if (target instanceof HTMLButtonElement) target.disabled = false;
      }
    }
  });
};
