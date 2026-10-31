import { CommonClientOptions } from '../interfaces';
import { OauthClient } from '../interfaces/authorizer';
import { request } from '../http';

interface TokenParams {
  code: string;
  redirect_uri: string;
}

interface ProfileParams {
  access_token: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: string;
}

export class LinkedinClient implements OauthClient {
  constructor(private options: CommonClientOptions) {}

  // Get the profile of the LinkedIn member the access token belongs to.
  async getProfile(payload: ProfileParams): Promise<any> {
    const { data } = await request('LinkedIn', 'https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${payload.access_token}` },
    });
    return data;
  }

  // Exchange an authorization code for an access token. LinkedIn expects a
  // form-encoded body (axios 0.21 sent the object as JSON).
  async getAccessToken(payload: TokenParams): Promise<TokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: payload.code,
      redirect_uri: payload.redirect_uri,
      client_id: this.options.clientId,
      client_secret: this.options.clientSecret,
    });
    const { data } = await request('LinkedIn', 'https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    return data;
  }
}
