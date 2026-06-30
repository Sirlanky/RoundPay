/** Normalize Nigerian mobile numbers to Termii format (234XXXXXXXXXX). */
export function normalizeNgPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('234') && digits.length === 13) return digits;
  if (digits.startsWith('0') && digits.length === 11) return `234${digits.slice(1)}`;
  if (digits.length === 10 && /^[789]/.test(digits)) return `234${digits}`;
  throw new Error('Enter a valid Nigerian phone number (e.g. 08012345678).');
}

export function isValidNgPhone(raw: string): boolean {
  try {
    normalizeNgPhone(raw);
    return true;
  } catch {
    return false;
  }
}

export function formatNgPhoneHint(raw: string): string {
  try {
    return normalizeNgPhone(raw);
  } catch {
    return raw.trim();
  }
}
