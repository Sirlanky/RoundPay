/** User-facing copy for Supabase auth errors. */
export function messageFromAuthError(
  error: unknown,
  mode?: 'login' | 'signup'
): string {
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
  if (/error sending.*magic link|magic link email|smtp|mail send|sender/i.test(msg)) {
    return 'Sign-in email could not be sent. In Supabase SMTP, set sender to onboarding@resend.dev (testing) or a verified domain address — not a Gmail address.';
  }
  if (
    mode === 'login' &&
    (/signups not allowed|user not found|no user|not registered|does not exist/i.test(msg) ||
      /otp.*disabled/i.test(msg))
  ) {
    return 'No account with this email yet. Create an account first, then you can log in.';
  }
  if (
    mode === 'signup' &&
    /already registered|already exists|user already/i.test(msg)
  ) {
    return 'An account with this email already exists. Log in instead.';
  }
  if (/provider is not enabled|oauth/i.test(msg)) {
    return 'This sign-in method is not enabled yet. Turn it on in Supabase → Authentication → Providers.';
  }
  return msg || 'Something went wrong. Try again.';
}
