import { CommonClientOptions } from "../interfaces";
import { OauthClient } from "../interfaces/authorizer";
import { HttpException } from "@nestjs/common";
import { HttpService } from '@nestjs/axios';

export class GoogleClient implements OauthClient {
  private http;
  constructor(private options: CommonClientOptions) {
    this.http = new HttpService();
  }

  // Sign in with the credential from the Facebook user.

  async getProfile(payload: Record<string, any>): Promise<any> {
    const link = `https://oauth2.googleapis.com/tokeninfo?id_token=${payload.id_token}}`;
    const response = await this.http
      .get(link, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
      .toPromise()
      .catch((err) => {
        throw new Error(err);
      });
    const { data } = response;
    if (data.aud !== this.options.clientId) {
      throw new HttpException("Unauthorized", 403);
    }
    return response.data;
  }
}
