import { parseFunctionError } from './parse-function-error';
import { supabase } from './supabase';

export type IdentityOtpChannel = 'phone' | 'email';

export async function sendIdentityOtp(channel: IdentityOtpChannel) {
  const { data, error, response } = await supabase.functions.invoke('send-identity-otp', {
    body: { channel },
  });

  if (error || (data as { error?: string })?.error) {
    throw new Error(await parseFunctionError(error, data, response));
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
  const { data, error, response } = await supabase.functions.invoke('verify-identity-otp', {
    body: { channel, code: code.trim() },
  });

  if (error || (data as { error?: string })?.error) {
    throw new Error(await parseFunctionError(error, data, response));
  }

  return (data as { data: { channel: string; verified: boolean } }).data;
}

export function isOtpProviderConfiguredHint(message: string): boolean {
  return /Termii is not configured|Resend is not configured|TERMII_|RESEND_/i.test(message);
}
