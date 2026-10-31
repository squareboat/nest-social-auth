import { UnauthorizedException } from '@nestjs/common';
import {
  LinkedinClientOptions,
  LinkedinCredentialsPayload,
  LinkedinProfile,
  LinkedinTokenPayload,
  LinkedinTokenResponse,
} from '../interfaces';
import { OauthClient } from '../interfaces/authorizer';
import { request } from '../http';

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
    const { data } = await request('LinkedIn', this.options.userInfoUrl || USERINFO_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data as T;
  }

  /**
   * Exchange the authorization code from LinkedIn's redirect for an access
   * token (3-legged OAuth). Do this on the server: it uses the client secret.
   */
  async getAccessToken(payload: LinkedinTokenPayload): Promise<LinkedinTokenResponse> {
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
    const { data } = await request('LinkedIn', this.options.tokenUrl || TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    return data;
  }
}
