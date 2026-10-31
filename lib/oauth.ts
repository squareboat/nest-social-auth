import { FacebookClient } from './clients/facebook';
import { GoogleClient } from './clients/google';
import { LinkedinClient } from './clients/linkedin';
import { Clients, OauthClient } from './interfaces';
import { OauthService } from './service';

/** Client class returned for each client name. */
export interface OauthClients {
  google: GoogleClient;
  facebook: FacebookClient;
  linkedin: LinkedinClient;
}

function resolveClient(client?: Clients): OauthClient {
  const options = OauthService.options;
  if (!options) {
    throw new Error(
      'OauthModule is not registered: add OauthModule.register() or OauthModule.registerAsync() to your module imports',
    );
  }
  const name = client || options.default;
  if (!name) {
    throw new Error('No client name passed and no `default` client set in the OauthModule options');
  }
  const instance = OauthService.clients[name];
  if (!instance) {
    throw new Error(`Oauth client "${name}" is not configured in the OauthModule options`);
  }
  return instance;
}

export class Oauth {
  static authorize<K extends Clients>(client: K): OauthClients[K];
  static authorize(client?: Clients): OauthClient;
  static authorize(client?: Clients): OauthClient {
    return resolveClient(client);
  }
}

export function Oauthorizer<K extends Clients>(client: K): OauthClients[K];
export function Oauthorizer(client?: Clients): OauthClient;
export function Oauthorizer(client?: Clients): OauthClient {
  return resolveClient(client);
}
