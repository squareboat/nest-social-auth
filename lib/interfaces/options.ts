import { ModuleMetadata, Type } from '@nestjs/common';

export type Clients = 'google'|'facebook'|'twitter'|'linkedin';

export interface CommonClientOptions {
  clientSecret: string;
  clientId: string;
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
    google?: CommonClientOptions;
    facebook?:CommonClientOptions;
    linkedin?:CommonClientOptions;
    twitter?:TwitterClientOption;
  };
}

export interface OauthAsyncOptionsFactory {
  createOauthOptions(): Promise<OauthOptions> | OauthOptions;
}

export interface OauthOptionsFactory {
    createOauthOptions(): Promise<OauthOptions> | OauthOptions;
}

export interface OauthAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  name?: string;
  isGlobal: boolean;
  useExisting?: Type<OauthOptions>;
  useClass?: Type<OauthOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<OauthOptions> | OauthOptions;
  inject?: any[];
}
