export function messageFromGroupError(e: unknown): string {
  if (!e || typeof e !== 'object') return 'Something went wrong. Try again.';
  const err = e as { message?: string; code?: string };
  const msg = err.message ?? '';

  if (msg.includes('Invalid invite code')) {
    return 'No draft group found with that code. Check the code or ask the admin if the group already started.';
  }
  if (msg.includes('already started') || msg.includes('status')) {
    return 'This group has already started. You can only join while it is still in draft.';
  }
  if (msg.includes('already in this group')) return 'You are already in this group.';
  if (msg.includes('Group is full')) return 'This group is full.';
  if (msg.includes('JWT') || msg.includes('not authenticated') || err.code === 'PGRST301') {
    return 'Sign in required. Leave build mode and sign in to save.';
  }
  if (msg.includes('profiles') || msg.includes('foreign key')) {
    return 'Complete your profile first, then try again.';
  }
  return msg || 'Something went wrong. Try again.';
}
