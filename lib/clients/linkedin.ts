import { CommonClientOptions } from '../interfaces';
import { OauthClient } from '../interfaces/authorizer';
import { HttpService } from '@nestjs/axios';

interface TokenParams {
  code: string;
  redirect_uri: string;
}

interface ProfileParams {
    access_token: string;
  }

interface TokenBody {
  code: string;
  redirect_uri: string;
  client_id: string;
  client_secret: string;
  grant_type: string ;
}

interface TokenResponse {
  access_token: string;
  expires_in: string;
}

export class LinkedinClient implements OauthClient {
  private http;
  constructor(private options: CommonClientOptions) {
    this.http = new HttpService();
  }

  // Sign in with the credential from the Facebook user.

  async getProfile(payload: ProfileParams): Promise<any> {
    const link = `https://api.linkedin.com/v2/me`;

    const response = await this.http
      .get(link, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded','Authorization':`Bearer ${payload.access_token}` },
      })
      .toPromise()
      .catch((err) => {
        throw new Error(err);
      });
    const { data } = response;
    return response.data
  }

  async getAccessToken(payload: TokenParams): Promise<TokenResponse> {
    const link = `https://www.linkedin.com/oauth/v2/accessToken`;
    const body: TokenBody = {
      ...payload,
      client_id: this.options.clientId,
      client_secret: this.options.clientSecret,
      grant_type: 'authorization_code',
    };
    const response = await this.http
      .post(link, body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .toPromise()
      .catch((err) => {
        throw new Error(err);
      });

    const { data } = response;
    return data;
  }
}
