const GENERIC_HTTP_MESSAGE = 'Edge Function returned a non-2xx status code';

async function readResponseError(response: unknown): Promise<string | null> {
  if (!response || typeof response !== 'object') return null;
  const res = response as Response;
  if (typeof res.json !== 'function') return null;

  try {
    const body = (await (typeof res.clone === 'function' ? res.clone() : res).json()) as {
      error?: unknown;
      message?: unknown;
    };
    if (typeof body.error === 'string' && body.error.trim()) return body.error.trim();
    if (typeof body.message === 'string' && body.message.trim()) return body.message.trim();
  } catch {
    // ignore parse failures
  }

  return null;
}

/** Extract a user-facing message from supabase.functions.invoke failures. */
export async function parseFunctionError(
  error: unknown,
  data: unknown,
  response?: unknown
): Promise<string> {
  if (data && typeof data === 'object') {
    const record = data as { error?: unknown; message?: unknown };
    if (typeof record.error === 'string' && record.error.trim()) return record.error.trim();
    if (typeof record.message === 'string' && record.message.trim()) return record.message.trim();
  }

  const fromResponse = await readResponseError(response);
  if (fromResponse) return fromResponse;

  if (error && typeof error === 'object') {
    const err = error as { message?: string; name?: string; context?: unknown };
    const fromContext = await readResponseError(err.context);
    if (fromContext) return fromContext;

    if (err.message && err.message !== GENERIC_HTTP_MESSAGE) {
      return err.message;
    }

    if (err.name === 'FunctionsFetchError') {
      return 'Could not reach the server. Check your internet connection and try again.';
    }
  }

  return 'Something went wrong. Try again.';
}
