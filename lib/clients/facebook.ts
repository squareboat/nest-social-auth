import { CommonClientOptions } from "../interfaces";
import { OauthClient } from "../interfaces/authorizer";
import { HttpService } from "@nestjs/common";

export class FacebookClient implements OauthClient {
  private http;
  constructor(private options: CommonClientOptions) {
    this.http = new HttpService();
  }

  // Sign in with the credential from the Facebook user.

  async getProfile(payload: Record<string, any>): Promise<any> {
    const link = `https://graph.facebook.com/me?access_token=${payload.accessToken}&client_id=${this.options.clientId}}&client_secret=${this.options.clientSecret}&grant_type=client_credentials&fields=email,name,picture`;
    const response = await this.http
      .get(link, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
      .toPromise()
      .catch((err) => {
        throw new Error(err);
      });
    return response.data;
  }
}
