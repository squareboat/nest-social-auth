import { Inject, Injectable } from '@nestjs/common';
import { OAUTH_OPTIONS } from './constants';
import { OauthOptions } from './interfaces';

@Injectable()
export class OauthMetadata {
  private static data: OauthOptions;

  constructor(@Inject(OAUTH_OPTIONS) data: OauthOptions) {
    OauthMetadata.data = data;
  }

  static getData(): OauthOptions {
    return OauthMetadata.data;
  }
}
