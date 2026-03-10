/**
 * Validates whether a string is a syntactically valid email address.
 *
 * Notes:
 * - This checks *format* only (not deliverability).
 * - It accepts common real-world emails and rejects obvious invalid ones.
 * - No regex can perfectly match the full RFC in a practical way—this is a pragmatic validator.
 *
 * @example
 * ```ts
 * isValidEmail("alex@example.com");          // true
 * isValidEmail("alex+tag@sub.example.co");   // true
 * isValidEmail("not-an-email");              // false
 * isValidEmail("a..b@example.com");          // false
 * isValidEmail("a@localhost");               // false
 * ```
 */
export const isValidEmail = (input: string): boolean => {
  const email = input.trim();

  // Quick sanity checks
  if (email.length < 3 || email.length > 254) return false;

  if (email.includes(' ')) return false;

  const at = email.indexOf('@');

  if (at <= 0 || at !== email.lastIndexOf('@') || at === email.length - 1)
    return false;

  const local = email.slice(0, at);
  const domain = email.slice(at + 1);

  // Local-part checks (pragmatic)
  if (local.length > 64) return false;

  if (local.startsWith('.') || local.endsWith('.')) return false;

  if (local.includes('..')) return false;

  // Domain checks
  if (domain.length < 3 || domain.length > 253) return false;

  if (domain.startsWith('.') || domain.endsWith('.')) return false;

  if (domain.includes('..')) return false;

  // Must contain at least one dot and a plausible TLD (2+ letters)
  if (!/\.[A-Za-z]{2,}$/.test(domain)) return false;

  // Disallow invalid domain chars and label rules
  // - labels: alnum + hyphen, not starting/ending with hyphen, max 63
  const labels = domain.split('.');

  if (labels.some((l) => l.length === 0 || l.length > 63)) return false;

  if (labels.some((l) => l.startsWith('-') || l.endsWith('-'))) return false;

  if (labels.some((l) => !/^[A-Za-z0-9-]+$/.test(l))) return false;

  // Allowed characters in local-part (common subset, unquoted)
  // If you need quoted local-parts, say so and I’ll expand it.
  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) return false;

  return true;
};
