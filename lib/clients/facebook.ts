import { CommonClientOptions, FacebookCredentialsPayload } from '../interfaces';
import { OauthClient } from '../interfaces/authorizer';
import { request } from '../http';

export class FacebookClient implements OauthClient {
  constructor(private options: CommonClientOptions) {}

  // Get the profile of the Facebook user the access token belongs to.
  async getProfile(payload: FacebookCredentialsPayload): Promise<any> {
    const query = new URLSearchParams({
      access_token: payload.accessToken || '',
      client_id: this.options.clientId,
      client_secret: this.options.clientSecret,
      grant_type: 'client_credentials',
      fields: 'email,name,picture',
    });
    const { data } = await request('Facebook', `https://graph.facebook.com/me?${query}`);
    return data;
  }
}
