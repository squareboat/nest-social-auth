import { ModuleMetadata, Type } from '@nestjs/common';

export type Clients = 'google'|'facebook'|'twitter'|'linkedin';

export interface CommonClientOptions {
  clientSecret: string;
  clientId: string;
}

export interface FacebookCredentialsPayload {
  accessToken?:string;
}


export interface GoogleClientOptions {
  /** OAuth client ID of your app; the ID token's `aud` must match it. */
  clientId: string;
  /** Not needed to verify ID tokens. */
  clientSecret?: string;
  /**
   * JWK set with Google's signing keys.
   * Default: https://www.googleapis.com/oauth2/v3/certs
   */
  certsUrl?: string;
}

export interface GoogleCredentialsPayload {
  /** The ID token (JWT) from Google Sign-In, e.g. the `credential` field. */
  id_token: string;
}

/** Claims of a verified Google ID token. */
export interface GoogleProfile {
  iss: string;
  sub: string;
  aud: string;
  azp?: string;
  iat: number;
  exp: number;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
  /** Google Workspace domain; missing for consumer accounts. */
  hd?: string;
  nonce?: string;
  [claim: string]: any;
}

  export interface TwitterClientOption {
    host: string;
    password: string;
    port: number;
    database: number;
    prefix: string;
  }



export interface OauthOptions {
  isGlobal?: boolean;
  default: Clients;
  clients: {
    google?: GoogleClientOptions;
    facebook?:CommonClientOptions;
    linkedin?:CommonClientOptions;
    twitter?:TwitterClientOption;
  };
}

export interface OauthOptionsFactory {
  createOauthOptions(): Promise<OauthOptions> | OauthOptions;
}

/**
 * @deprecated Use `OauthOptionsFactory`.
 */
export type OauthAsyncOptionsFactory = OauthOptionsFactory;

export interface OauthAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  name?: string;
  isGlobal?: boolean;
  useExisting?: Type<OauthOptionsFactory>;
  useClass?: Type<OauthOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<OauthOptions> | OauthOptions;
  inject?: any[];
}
