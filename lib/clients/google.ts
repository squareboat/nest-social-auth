import { UnauthorizedException } from '@nestjs/common';
import { createPublicKey, KeyObject, verify } from 'node:crypto';
import {
  GoogleClientOptions,
  GoogleCredentialsPayload,
  GoogleProfile,
} from '../interfaces';
import { OauthClient } from '../interfaces/authorizer';
import { OauthProviderError, request } from '../http';

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];
// the allowance google-auth-library uses for iat/exp
const CLOCK_SKEW_SECONDS = 300;

function decodeSegment(segment: string): Record<string, any> | undefined {
  try {
    const value = JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
    return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

function invalid(reason: string): UnauthorizedException {
  return new UnauthorizedException(`Google: invalid ID token (${reason})`);
}

/**
 * Verifies Google ID tokens the way Google recommends for production
 * (https://developers.google.com/identity/gsi/web/guides/verify-google-id-token):
 * RS256 signature against Google's published keys (cached for the
 * Cache-Control max-age), then `iss`, `aud` and `exp`. The tokeninfo
 * endpoint used before is meant for debugging and may be throttled.
 */
export class GoogleClient implements OauthClient {
  private keys?: Promise<Map<string, KeyObject>>;
  private keysExpireAt = 0;

  constructor(private options: GoogleClientOptions) {}

  /**
   * Verify the ID token from Google Sign-In and return its claims.
   * Throws `UnauthorizedException` if the token is not valid for your client ID.
   */
  async getProfile<T = GoogleProfile>(payload: GoogleCredentialsPayload): Promise<T> {
    const token = payload?.id_token;
    const parts = typeof token === 'string' ? token.split('.') : [];
    if (parts.length !== 3) throw invalid('malformed');
    const [rawHeader, rawClaims, rawSignature] = parts;
    const header = decodeSegment(rawHeader);
    const claims = decodeSegment(rawClaims);
    if (!header || !claims) throw invalid('malformed');
    if (header.alg !== 'RS256') throw invalid(`unexpected algorithm ${header.alg}`);

    const key = (await this.getKeys()).get(header.kid);
    if (!key) throw invalid('unknown signing key');
    const signed = verify(
      'RSA-SHA256',
      Buffer.from(`${rawHeader}.${rawClaims}`),
      key,
      Buffer.from(rawSignature, 'base64url'),
    );
    if (!signed) throw invalid('bad signature');

    this.checkClaims(claims);
    return claims as T;
  }

  private checkClaims(claims: Record<string, any>): void {
    if (!GOOGLE_ISSUERS.includes(claims.iss)) throw invalid('wrong issuer');
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!audiences.includes(this.options.clientId)) {
      throw invalid('issued for another client ID');
    }
    const now = Math.floor(Date.now() / 1000);
    if (typeof claims.exp !== 'number') throw invalid('no expiry');
    if (now > claims.exp + CLOCK_SKEW_SECONDS) throw invalid('expired');
    if (typeof claims.iat === 'number' && claims.iat > now + CLOCK_SKEW_SECONDS) {
      throw invalid('issued in the future');
    }
  }

  private getKeys(): Promise<Map<string, KeyObject>> {
    if (!this.keys || Date.now() >= this.keysExpireAt) {
      // concurrent logins share one request
      this.keysExpireAt = Infinity;
      const pending = this.fetchKeys();
      this.keys = pending;
      pending.catch(() => {
        if (this.keys === pending) {
          this.keys = undefined;
          this.keysExpireAt = 0;
        }
      });
    }
    return this.keys;
  }

  private async fetchKeys(): Promise<Map<string, KeyObject>> {
    const { data, headers } = await request(
      'Google',
      this.options.certsUrl || GOOGLE_CERTS_URL,
      {},
      false,
    );
    if (!data || !Array.isArray(data.keys)) {
      throw new OauthProviderError('Google: unexpected response from the certs endpoint', 'Google');
    }
    const keys = new Map<string, KeyObject>();
    for (const jwk of data.keys) {
      if (!jwk || jwk.kty !== 'RSA' || typeof jwk.kid !== 'string') continue;
      try {
        keys.set(jwk.kid, createPublicKey({ key: jwk, format: 'jwk' }));
      } catch {
        // skip keys Node cannot read
      }
    }
    const maxAge = /max-age=(\d+)/i.exec(headers.get('cache-control') || '');
    this.keysExpireAt = Date.now() + (maxAge ? Number(maxAge[1]) * 1000 : 0);
    return keys;
  }
}
