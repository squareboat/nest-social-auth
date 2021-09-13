import { OauthClient, Clients } from './interfaces';
import { OauthMetadata } from './metadata';
import { OauthService } from './service';

export class Oauth {
  static authorize(client?: Clients): OauthClient {
    const options = OauthMetadata.getData();
    return OauthService.clients[client || options.default];
  }
}

export function Oauthorizer(client?: Clients): OauthClient {
  const options = OauthMetadata.getData();
  return OauthService.clients[client || options.default];
}
