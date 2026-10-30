// Anything can be thrown: an Error, a Supabase or PostgREST error, which is a
// plain object with a code, a string, or nothing. The error page and its bug
// report read them through this, so a plain object isn't "[object Object]"
// (#109).

export type NormalizedError = {
  name: string;
  message: string;
  /** Like PostgREST's `42501`, or an HTTP status */
  code?: string;
  /** PostgREST's details and hint */
  details?: string;
  stack?: string;
};

const text = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

/** The name, message, code, details and stack of any thrown value. */
export const normalizeError = (value: unknown): NormalizedError => {
  if (typeof value === 'string') {
    return { name: 'Error', message: text(value) ?? 'Unknown error' };
  }

  if (!value || typeof value !== 'object') {
    return { name: 'Error', message: 'Unknown error' };
  }

  const e = value as Record<string, unknown>;
  const code = e.code ?? e.status;
  const details = [text(e.details), text(e.hint)].filter(Boolean).join(' ');

  let message = text(e.message);

  if (!message) {
    try {
      message = JSON.stringify(value);
    } catch {
      // Circular
    }
  }

  return {
    name: text(e.name) ?? 'Error',
    message: message && message !== '{}' ? message : 'Unknown error',
    ...((typeof code === 'string' || typeof code === 'number') &&
      String(code) && { code: String(code) }),
    ...(details && { details }),
    ...(text(e.stack) && { stack: text(e.stack) })
  };
};
