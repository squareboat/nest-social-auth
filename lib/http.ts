import { UnauthorizedException } from '@nestjs/common';

/**
 * Thrown when a provider could not be reached or answered with an error that
 * is not about the user's credentials (rate limits, 5xx, unexpected bodies).
 * Rejected credentials throw `UnauthorizedException` instead.
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

export interface ProviderResponse<T = any> {
  data: T;
  headers: Headers;
}

// Error text from the shapes Google, Facebook and LinkedIn use.
function describe(body: any): string {
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
 * 400/401/403 answers mean the provider rejected the token or code and throw
 * `UnauthorizedException` (unless `credentialErrors` is false); other
 * failures throw `OauthProviderError`.
 * Messages never contain the URL, because it can carry tokens.
 */
export async function request<T = any>(
  provider: string,
  url: string,
  init: RequestInit = {},
  credentialErrors = true,
): Promise<ProviderResponse<T>> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { Accept: 'application/json', ...(init.headers as Record<string, string>) },
    });
  } catch (err: any) {
    throw new OauthProviderError(
      `${provider}: request failed (${err?.cause?.code || err?.message || err})`,
      provider,
      undefined,
      undefined,
      { cause: err },
    );
  }

  const text = await res.text();
  let data: any = text;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // keep the raw text
  }

  if (res.ok) return { data, headers: res.headers };

  const reason = describe(data);
  if (credentialErrors && (res.status === 400 || res.status === 401 || res.status === 403)) {
    throw new UnauthorizedException(`${provider}: ${reason || 'credentials rejected'}`);
  }
  throw new OauthProviderError(
    `${provider}: request failed with status ${res.status}${reason ? ` (${reason})` : ''}`,
    provider,
    res.status,
    data,
  );
}
