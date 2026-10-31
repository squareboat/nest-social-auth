import { HttpException } from '@nestjs/common';
import { CommonClientOptions, GoogleCredentialsPayload } from '../interfaces';
import { OauthClient } from '../interfaces/authorizer';
import { request } from '../http';

export class GoogleClient implements OauthClient {
  constructor(private options: CommonClientOptions) {}

  // Verify the ID token from Google Sign-In and return its claims.
  async getProfile(payload: GoogleCredentialsPayload): Promise<any> {
    const link = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(payload.id_token || '')}`;
    const { data } = await request('Google', link);
    if (data.aud !== this.options.clientId) {
      throw new HttpException('Unauthorized', 403);
    }
    return data;
  }
}
