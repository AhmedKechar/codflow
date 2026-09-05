/**
 * Normalize an Algerian phone number to E.164 format.
 *
 * Accepts: 0551234567, 5 51-234 567, +213551234567, 213551234567
 * Returns: +213551234567 or null if invalid.
 */
export function normalizeAlgerianPhone(raw: string): string | null {
  if (!raw) return null;

  // Strip spaces, dashes, parentheses, dots
  const cleaned = raw.replace(/[\s\-().]/g, "");

  // Already E.164
  if (/^\+213\d{9}$/.test(cleaned)) return cleaned;

  // With 213 prefix (no +)
  if (/^213\d{9}$/.test(cleaned)) return `+${cleaned}`;

  // Local format: 0 followed by 9 digits
  if (/^0\d{9}$/.test(cleaned)) return `+213${cleaned.slice(1)}`;

  // 9 digits starting with 5-7 (Algerian mobile)
  if (/^[5-7]\d{8}$/.test(cleaned)) return `+213${cleaned}`;

  return null;
}
