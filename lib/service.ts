import { Inject, Injectable } from '@nestjs/common';
import { FacebookClient } from './clients/facebook';
import { GoogleClient } from './clients/google';
import { LinkedinClient } from './clients/linkedin';
import { OAUTH_OPTIONS } from './constants';
import { OauthClient, OauthOptions } from './interfaces';

@Injectable()
export class OauthService {
  static clients: Record<string, OauthClient> = {};
  static options?: OauthOptions;

  // The clients are built when Nest creates the provider, so they are ready
  // after Test.createTestingModule(...).compile() too, without app.init().
  constructor(@Inject(OAUTH_OPTIONS) options: OauthOptions) {
    const { facebook, google, linkedin } = options?.clients || {};
    const clients: Record<string, OauthClient> = {};
    if (facebook) clients.facebook = new FacebookClient(facebook);
    if (google) clients.google = new GoogleClient(google);
    if (linkedin) clients.linkedin = new LinkedinClient(linkedin);
    OauthService.clients = clients;
    OauthService.options = options;
  }
}
