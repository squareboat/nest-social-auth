import { UnauthorizedException } from '@nestjs/common';

/**
 * Thrown when a provider could not be reached or answered with an error that
 * is not about the user's credentials: rate limits, a wrong app/client
 * secret, 5xx, unexpected bodies. Rejected credentials throw
 * `UnauthorizedException` instead.
 */
export class OauthProviderError extends Error {
  constructor(
    message: string,
    readonly provider: string,
    readonly status?: number,
    readonly body?: any,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'OauthProviderError';
  }
}

/** Milliseconds a provider gets to answer, unless the client sets `timeout`. */
export const DEFAULT_TIMEOUT = 10_000;

export interface ProviderResponse<T = any> {
  data: T;
  headers: Headers;
}

// Error text from the shapes Google, Facebook and LinkedIn use.
export function describe(body: any): string {
  if (!body || typeof body !== 'object') {
    return typeof body === 'string' ? body.slice(0, 200) : '';
  }
  if (body.error && typeof body.error === 'object') {
    return body.error.message || body.error.type || '';
  }
  return body.error_description || body.message || body.error || '';
}

/**
 * Calls a provider endpoint with Node's global fetch and parses the JSON body.
 * HttpModule/HttpService left @nestjs/common in Nest 8, and @nestjs/axios 12
 * is ESM only, so the package uses fetch and has no HTTP dependency.
 *
 * Every failure (network error, timeout, non-2xx answer) throws `OauthProviderError`
 * with `status` and `body`. Each client decides with `credentialError()`
 * which answers mean the user's token or code was rejected: the HTTP status
 * alone can't tell, e.g. Facebook sends rate limits as 400/403.
 * Messages never contain the URL, because it can carry tokens.
 */
export async function request<T = any>(
  provider: string,
  url: string,
  init: RequestInit = {},
  timeout?: number,
): Promise<ProviderResponse<T>> {
  const ms = typeof timeout === 'number' && timeout > 0 ? timeout : DEFAULT_TIMEOUT;
  let res: Response;
  let text: string;
  try {
    // undici waits up to 300 s for headers by default; the signal also
    // covers reading the body
    res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(ms),
      headers: { Accept: 'application/json', ...(init.headers as Record<string, string>) },
    });
    text = await res.text();
  } catch (err: any) {
    const timedOut = err?.name === 'TimeoutError' || err?.cause?.name === 'TimeoutError';
    throw new OauthProviderError(
      timedOut
        ? `${provider}: no response within ${ms} ms`
        : `${provider}: request failed (${err?.cause?.code || err?.message || err})`,
      provider,
      undefined,
      undefined,
      { cause: err },
    );
  }

  let data: any = text;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // keep the raw text
  }

  if (res.ok) return { data, headers: res.headers };

  const reason = describe(data);
  throw new OauthProviderError(
    `${provider}: request failed with status ${res.status}${reason ? ` (${reason})` : ''}`,
    provider,
    res.status,
    data,
  );
}

/**
 * Turns an `OauthProviderError` into `UnauthorizedException` when
 * `rejected(status, body)` says the provider rejected the user's token or
 * code. Anything else is returned unchanged, so server-side problems
 * (wrong secret, rate limits, outages) stay errors Nest logs as 500s.
 */
export function credentialError(
  err: unknown,
  rejected: (status: number, body: any) => boolean,
): unknown {
  if (err instanceof OauthProviderError && err.status !== undefined && rejected(err.status, err.body)) {
    return new UnauthorizedException(`${err.provider}: ${describe(err.body) || 'credentials rejected'}`);
  }
  return err;
}
