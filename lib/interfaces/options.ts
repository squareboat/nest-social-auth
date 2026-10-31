import { ModuleMetadata, Type } from '@nestjs/common';

export type Clients = 'google'|'facebook'|'twitter'|'linkedin';

export interface CommonClientOptions {
  clientSecret: string;
  clientId: string;
}

export interface FacebookClientOptions {
  /** App ID. The access token must have been issued for this app. */
  clientId: string;
  /** App secret. Used for debug_token and appsecret_proof, never sent to the client. */
  clientSecret: string;
  /** Graph API version. Default: v26.0. */
  graphApiVersion?: string;
  /** Default: https://graph.facebook.com */
  graphApiUrl?: string;
}

export interface FacebookCredentialsPayload {
  /** User access token from Facebook Login. */
  accessToken: string;
}

/** Fields returned by /me?fields=id,name,email,picture */
export interface FacebookProfile {
  id: string;
  name?: string;
  /** Missing if the user has no email or did not grant the `email` permission. */
  email?: string;
  picture?: {
    data: { url: string; width?: number; height?: number; is_silhouette?: boolean };
  };
  [field: string]: any;
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

export interface LinkedinClientOptions {
  clientId: string;
  clientSecret: string;
  /** Default: https://www.linkedin.com/oauth/v2/accessToken */
  tokenUrl?: string;
  /**
   * Default: https://api.linkedin.com/v2/userinfo ("Sign In with LinkedIn
   * using OpenID Connect", scopes `openid profile email`). Apps still on the
   * legacy "Sign In with LinkedIn" product (deprecated by LinkedIn on
   * 1 Aug 2023) can set https://api.linkedin.com/v2/me.
   */
  userInfoUrl?: string;
}

export interface LinkedinTokenPayload {
  /** The `code` LinkedIn sent to your redirect URI. */
  code: string;
  /** The same redirect_uri used in the authorization request. */
  redirect_uri: string;
}

export interface LinkedinCredentialsPayload {
  access_token: string;
}

export interface LinkedinTokenResponse {
  access_token: string;
  /** Seconds until the access token expires. */
  expires_in: number;
  scope?: string;
  token_type?: string;
  /** Present when the `openid` scope was requested. */
  id_token?: string;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  [field: string]: any;
}

/** Response of the OpenID Connect userinfo endpoint. */
export interface LinkedinProfile {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string | { country: string; language: string };
  /** Only with the `email` scope, and not for every member. */
  email?: string;
  email_verified?: boolean;
  [field: string]: any;
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
    facebook?: FacebookClientOptions;
    linkedin?: LinkedinClientOptions;
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
