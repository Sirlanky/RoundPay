export function messageFromGroupError(e: unknown): string {
  if (!e || typeof e !== 'object') return 'Something went wrong. Try again.';
  const err = e as { message?: string; code?: string };
  const msg = err.message ?? '';

  if (
    msg.includes('YOUVERIFY_NOT_CONFIGURED') ||
    msg.includes('verify-nin') ||
    msg.includes('YouVerify')
  ) {
    return 'NIN verification is not set up yet. Add YOUVERIFY_API_KEY to Supabase Edge Function secrets, deploy verify-nin, and run migration 038.';
  }
  if (msg.includes('SELFIE_PERMISSION_DENIED') || msg.includes('Selfie image is too large')) {
    return msg;
  }
  if (msg.includes('You must consent to NIN verification') || msg.includes('Enter a valid 11-digit NIN')) {
    return msg;
  }
  if (msg.includes('Selfie does not match') || msg.includes('NIN could not be verified')) {
    return msg;
  }
  if (/does not match|Real NINs cannot be verified in YouVerify sandbox/i.test(msg)) {
    return msg;
  }
  if (msg.includes('RESEND_RECIPIENT_RESTRICTED') || /only send testing emails|verify a domain at resend/i.test(msg)) {
    return 'Resend is in test mode and can only email one address until your domain is verified. Tap Send code again — use the on-screen code, or verify roundpayajo.ng in Resend.';
  }
  if (msg.includes('IDENTITY_NOT_VERIFIED')) {
    return 'Verify your identity in Profile before creating or joining a group.';
  }
  if (msg.includes('Payout order can only be changed while the group is in draft')) {
    return 'Collection order can only be changed while the group is still in draft. After start, everyone must agree to any change.';
  }
  if (msg.includes('Invalid or expired code')) {
    return 'That code is wrong or expired. Tap Send code again, then enter the new code shown on screen.';
  }
  if (/verification error|Termii verify OTP failed/i.test(msg)) {
    return 'That code did not match. Tap Send code again and use the code shown on screen (not a text message).';
  }
  if (msg.includes('OTP_PHONE_NOT_VERIFIED') || msg.includes('DOJAH_PHONE_NOT_VERIFIED')) {
    return 'Verify your phone number with the OTP code before completing verification.';
  }
  if (msg.includes('OTP_EMAIL_NOT_VERIFIED') || msg.includes('DOJAH_EMAIL_NOT_VERIFIED')) {
    return 'Verify your email with the OTP code before completing verification.';
  }
  if (msg.includes('IDENTITY_PROFILE_EMAIL_REQUIRED')) {
    return 'Add your email in Profile before completing verification.';
  }
  if (msg.includes('Enter a valid Nigerian phone number')) {
    return msg;
  }
  if (/ApplicationSenderId not found|senderName|Termii send OTP failed/i.test(msg)) {
    return 'SMS sender is not set up in Termii. Update TERMII_SENDER_ID in Supabase secrets to your approved sender name, or retry — a dev code may appear if SMS fails.';
  }
  if (
    msg.includes('Termii is not configured') ||
    msg.includes('Resend is not configured') ||
    msg.includes('send-identity-otp') ||
    msg.includes('verify-identity-otp') ||
    msg.includes('Failed to send a request to the Edge Function') ||
    msg.includes('Edge Function returned a non-2xx status code')
  ) {
    return 'Phone/email OTP is not set up yet. Deploy send-identity-otp and verify-identity-otp, add TERMII_API_KEY (SMS) and RESEND secrets in Supabase, or use the dev code shown after Send code when SMS is not configured.';
  }
  if (msg.includes('IDENTITY_PROFILE_NAME_REQUIRED')) {
    return 'Add your first and last name in Profile before verifying.';
  }
  if (msg.includes('IDENTITY_PROFILE_PHONE_REQUIRED')) {
    return 'Add your phone number in Profile before verifying.';
  }
  if (msg.includes('ADMIN_IDENTITY_IN_REVIEW') || msg.includes('Identity verification already submitted')) {
    return 'Your identity is in review. You can create a group once verification is approved.';
  }
  if (
    msg.includes('ADMIN_IDENTITY_REQUIRED') ||
    msg.includes('Identity verification must be approved') ||
    (msg.includes('row-level security') && msg.includes('groups'))
  ) {
    return 'Verify your identity before creating a group. Open Profile → Identity Verification.';
  }
  if (msg.includes('IDENTITY_MIGRATION_REQUIRED') || msg.includes('submit_identity_verification')) {
    return 'Run supabase/migrations/022_identity_verification.sql in Supabase SQL Editor, then try again.';
  }
  if (msg.includes('PLACEHOLDER_IDENTITY_MIGRATION_REQUIRED') || msg.includes('submit_placeholder_identity_verification')) {
    return 'Run supabase/migrations/026_placeholder_identity_submit.sql in Supabase SQL Editor, then try again.';
  }
  if (msg.includes('FREQUENCY_NOT_SUPPORTED') || msg.includes('groups_frequency_check')) {
    return 'Daily schedules need a one-time database update. Run supabase/migrations/021_group_frequency.sql in Supabase SQL Editor, then try again.';
  }
  if (msg.includes('Invalid invite code')) {
    return 'No draft group found with that code. Check the code or ask the admin if the group already started.';
  }
  if (msg.includes('already started') && msg.includes('draft')) {
    return 'This group has already started. You can only join while it is still in draft.';
  }
  if (msg.includes('already in this group')) return 'You are already in this group.';
  if (msg.includes('Group is full')) return 'This group is full.';
  if (msg.includes('must join before starting')) {
    return msg.replace(/^All (\d+) members must join before starting$/, 'All $1 members must join before you can start.');
  }
  if (msg.includes('advance_cycle')) {
    return 'Run ADVANCE_CYCLE_FIX.sql in Supabase SQL Editor, then tap Start next cycle again.';
  }
  if (msg.includes('record_cycle_payout')) {
    return 'Run RECORD_PAYOUT_FIX.sql in Supabase SQL Editor (section 7), then try again.';
  }
  if (msg.includes('record_contribution_payment')) {
    return 'Run RECORD_PAYMENT_FIX.sql in Supabase SQL Editor (section 6), then try again.';
  }
  if (msg.includes('start_group')) {
    return 'Run section 4 in supabase/migrations/RUN_IN_SQL_EDITOR.sql in Supabase SQL Editor, then try again.';
  }
  if (msg.includes('set_admin_participation')) {
    return 'Run section 5 in supabase/migrations/RUN_IN_SQL_EDITOR.sql in Supabase SQL Editor, then try again.';
  }
  if (msg.includes('delete_draft_group') || (msg.includes('Only draft groups') && msg.includes('deleted'))) {
    return 'Run supabase/migrations/016_delete_draft_group_fix.sql in Supabase SQL Editor, then try again.';
  }
  if (msg.includes('Only the admin can delete')) return 'Only the group admin can delete this group.';
  if (msg.includes('Only draft groups can be deleted')) return 'Only groups that have not started can be deleted.';
  if (err.code === 'PGRST202' || msg.includes('Could not find the function')) {
    return 'Run supabase/migrations/RUN_IN_SQL_EDITOR.sql in Supabase SQL Editor (all sections), then try again.';
  }
  if (msg.includes('Only admin can record payments') || msg.includes('Not authorized to record')) {
    return 'Only the group admin can record payments.';
  }
  if (msg.includes('Could not mark payment')) return msg;
  if (msg.includes('not accepting payments')) return msg;
  if (msg.includes('All members must pay before payout')) return msg;
  if (msg.includes('Not all contributions are paid')) return msg;
  if (msg.includes('Only admin can record payout')) return msg;
  if (msg.includes('at least 2 members')) return 'All members must join before starting.';
  if (msg.includes('Cannot change after')) return 'You can only join or leave the rotation before the group starts.';
  if (msg.includes('Only the admin')) return 'Only the group admin can change this setting.';
  if (msg.includes('cannot be started')) return 'This group cannot be started in its current state.';
  if (msg.includes('JWT') || msg.includes('not authenticated') || err.code === 'PGRST301') {
    return 'Sign in required. Leave build mode and sign in to save.';
  }
  if (
    msg.includes('profiles') ||
    msg.includes('foreign key') ||
    msg.includes('RUN_IN_SQL_EDITOR') ||
    msg.includes('ensure_my_profile') ||
    msg.includes('Profile insert blocked') ||
    msg.includes('Missing ensure_my_profile')
  ) {
    return 'Database fix needed: run supabase/migrations/RUN_IN_SQL_EDITOR.sql in Supabase SQL Editor, then Sign out → Enter app, and create again.';
  }
  if (msg.includes('row-level security') || msg.includes('RLS') || err.code === '42501') {
    return 'Permission denied. Run RECORD_PAYOUT_FIX.sql and RECORD_PAYMENT_FIX.sql in Supabase SQL Editor, then try again.';
  }
  return msg || 'Something went wrong. Try again.';
}
