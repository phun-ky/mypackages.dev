/* eslint-disable @stylistic/indent */

import { supabase } from '..';
import { normalizePackageName } from '../../../utils/package/normalize-package-name';

/* eslint-disable @typescript-eslint/no-explicit-any */
type EnsureResponse =
  | { ok: true; code: 'INSERTED'; row: any; message: string }
  | {
      ok: true;
      code: 'ALREADY_EXISTS';
      message: string;
      packageName: string;
      registry: string;
    }
  | {
      ok: false;
      code?: 'NOT_FOUND';
      message?: string;
      error?: string;
      packageName?: string;
      registry?: string;
    };

export const ensurePackage = async (
  raw: string,
  registry: 'npm' | 'github' = 'npm'
) => {
  const packageName = normalizePackageName(raw);
  const { data, error } = await supabase.functions.invoke<EnsureResponse>(
    'ensure_package',
    {
      body: { packageName, registry }
    }
  );

  if (error) {
    // This is a network / function invocation error
    return { ok: false, error: error.message } as EnsureResponse;
  }

  return data as EnsureResponse;
};

export const deleteEnsuredPackage = async (id: number) => {
  const { error } = await supabase
    .from('ensured_packages')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
