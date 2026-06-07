/** User-facing copy for Supabase auth errors. */
export function messageFromAuthError(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Something went wrong. Try again.';
  const msg = (error as { message?: string }).message ?? '';

  if (/rate limit/i.test(msg)) {
    return 'Too many sign-in emails sent. Wait about 1 hour, then try once. Check inbox/spam for an older code or link.';
  }
  if (/anonymous|disabled|not enabled/i.test(msg)) {
    return 'Guest sign-in is disabled. In Supabase → Authentication → Providers, turn on Anonymous sign-ins.';
  }
  if (/invalid.*otp|token.*expired|expired/i.test(msg)) {
    return 'That code is invalid or expired. Tap Resend email and try the new code.';
  }
  if (/email.*invalid/i.test(msg)) {
    return 'Enter a valid email address.';
  }
  if (/invalid login credentials|invalid credentials/i.test(msg)) {
    return 'Wrong email or password. Try again or use a sign-in code instead.';
  }
  return msg || 'Something went wrong. Try again.';
}
