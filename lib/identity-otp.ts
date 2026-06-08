import { supabase } from './supabase';

export type IdentityOtpChannel = 'phone' | 'email';

function parseFunctionError(error: unknown, data: unknown): string {
  if (data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string') {
    return (data as { error: string }).error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: string }).message);
  }
  return 'Something went wrong. Try again.';
}

export async function sendIdentityOtp(channel: IdentityOtpChannel) {
  const { data, error } = await supabase.functions.invoke('send-identity-otp', {
    body: { channel },
  });

  if (error || (data as { error?: string })?.error) {
    throw new Error(parseFunctionError(error, data));
  }

  return (data as {
    data: {
      reference_id: string;
      destination: string;
      status: string;
      channel: string;
      dev_code?: string;
    };
  }).data;
}

export async function verifyIdentityOtp(channel: IdentityOtpChannel, code: string) {
  const { data, error } = await supabase.functions.invoke('verify-identity-otp', {
    body: { channel, code: code.trim() },
  });

  if (error || (data as { error?: string })?.error) {
    throw new Error(parseFunctionError(error, data));
  }

  return (data as { data: { channel: string; verified: boolean } }).data;
}

export function isOtpProviderConfiguredHint(message: string): boolean {
  return /Termii is not configured|Resend is not configured|TERMII_|RESEND_/i.test(message);
}
