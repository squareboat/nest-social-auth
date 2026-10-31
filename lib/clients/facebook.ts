import { UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import {
  FacebookClientOptions,
  FacebookCredentialsPayload,
  FacebookProfile,
} from '../interfaces';
import { OauthClient } from '../interfaces/authorizer';
import { request } from '../http';

const GRAPH_API_URL = 'https://graph.facebook.com';
// unversioned calls use whatever version the app dashboard is set to
const GRAPH_API_VERSION = 'v26.0';
const PROFILE_FIELDS = 'id,name,email,picture';

export class FacebookClient implements OauthClient {
  constructor(private options: FacebookClientOptions) {}

  /**
   * Get the profile of the Facebook user the access token belongs to.
   *
   * The token is first checked with debug_token: it must be valid, a user
   * token, and issued for this app (`clientId`). Without that check a token
   * the user gave to any other Facebook app would log them in here.
   * /me is then called with appsecret_proof.
   */
  async getProfile<T = FacebookProfile>(payload: FacebookCredentialsPayload): Promise<T> {
    const token = payload?.accessToken;
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Facebook: access token missing');
    }
    const { clientId, clientSecret } = this.options;
    if (!clientId || !clientSecret) {
      throw new Error('Facebook: clientId and clientSecret must be set in the OauthModule options');
    }
    const base = `${(this.options.graphApiUrl || GRAPH_API_URL).replace(/\/+$/, '')}/${
      this.options.graphApiVersion || GRAPH_API_VERSION
    }`;

    const debug = await request(
      'Facebook',
      `${base}/debug_token?${new URLSearchParams({
        input_token: token,
        access_token: `${clientId}|${clientSecret}`,
      })}`,
    );
    const info = debug.data?.data;
    if (!info || info.is_valid !== true) {
      throw new UnauthorizedException(
        `Facebook: ${info?.error?.message || 'invalid access token'}`,
      );
    }
    if (String(info.app_id) !== String(clientId)) {
      throw new UnauthorizedException('Facebook: access token was issued for another app');
    }
    if (info.type && info.type !== 'USER') {
      throw new UnauthorizedException('Facebook: not a user access token');
    }

    const { data } = await request(
      'Facebook',
      `${base}/me?${new URLSearchParams({
        fields: PROFILE_FIELDS,
        access_token: token,
        appsecret_proof: createHmac('sha256', clientSecret).update(token).digest('hex'),
      })}`,
    );
    if (info.user_id && String(data?.id) !== String(info.user_id)) {
      throw new UnauthorizedException('Facebook: profile does not match the access token');
    }
    return data as T;
  }
}
