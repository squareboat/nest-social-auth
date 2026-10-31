import { UnauthorizedException } from '@nestjs/common';
import {
  LinkedinClientOptions,
  LinkedinCredentialsPayload,
  LinkedinProfile,
  LinkedinTokenPayload,
  LinkedinTokenResponse,
} from '../interfaces';
import { OauthClient } from '../interfaces/authorizer';
import { credentialError, request } from '../http';

const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
// "Sign In with LinkedIn using OpenID Connect"; /v2/me belongs to the
// legacy product LinkedIn deprecated on 1 Aug 2023
const USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';

export class LinkedinClient implements OauthClient {
  constructor(private options: LinkedinClientOptions) {}

  /**
   * Get the profile of the LinkedIn member the access token belongs to,
   * from the OpenID Connect userinfo endpoint.
   */
  async getProfile<T = LinkedinProfile>(payload: LinkedinCredentialsPayload): Promise<T> {
    const token = payload?.access_token;
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('LinkedIn: access token missing');
    }
    try {
      const { data } = await request('LinkedIn', this.options.userInfoUrl || USERINFO_URL, {
        headers: { Authorization: `Bearer ${token}` },
      }, this.options.timeout);
      return data as T;
    } catch (err) {
      // 401: invalid, expired or revoked token. 403 means the token lacks the
      // openid/profile scopes the app asked for: an app problem, kept as is.
      throw credentialError(err, (status) => status === 401);
    }
  }

  /**
   * Exchange the authorization code from LinkedIn's redirect for an access
   * token (3-legged OAuth). Do this on the server: it uses the client secret.
   */
  async getAccessToken(payload: LinkedinTokenPayload): Promise<LinkedinTokenResponse> {
    if (!this.options.clientId || !this.options.clientSecret) {
      throw new Error('LinkedIn: clientId and clientSecret must be set in the OauthModule options');
    }
    if (!payload?.code || typeof payload.code !== 'string') {
      throw new UnauthorizedException('LinkedIn: authorization code missing');
    }
    // LinkedIn expects a form-encoded body
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: payload.code,
      redirect_uri: payload.redirect_uri ?? '',
      client_id: this.options.clientId,
      client_secret: this.options.clientSecret,
    });
    try {
      const { data } = await request('LinkedIn', this.options.tokenUrl || TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      }, this.options.timeout);
      return data;
    } catch (err) {
      // bad, expired or reused code, or a redirect_uri that doesn't match.
      // invalid_client (wrong client ID/secret) is a server-side problem.
      throw credentialError(
        err,
        (status, res) => (status === 400 || status === 401) && res?.error !== 'invalid_client',
      );
    }
  }
}
