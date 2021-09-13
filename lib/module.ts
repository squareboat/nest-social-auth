import { DynamicModule, Module, Provider } from '@nestjs/common';
import { OAUTH_OPTIONS } from './constants';
import {
  OauthAsyncOptions,
  OauthAsyncOptionsFactory,
  OauthOptions,
} from './interfaces';
import { OauthMetadata } from './metadata';
import { OauthService } from './service';

@Module({})
export class OauthModule {
  /**
   * Register options
   * @param options
   */
  static register(options: OauthOptions): DynamicModule {
    return {
      global: options.isGlobal || false,
      module: OauthModule,
      providers: [
        OauthService,
        OauthMetadata,
        { provide: OAUTH_OPTIONS, useValue: options },
      ],
    };
  }

  /**
   * Register Async Options
   */
  static registerAsync(options: OauthAsyncOptions): DynamicModule {
    return {
      global: options.isGlobal || false,
      module: OauthModule,
      providers: [
        this.createStorageOptionsProvider(options),
        OauthService,
        OauthMetadata,
      ],
    };
  }

  private static createStorageOptionsProvider(
    options: OauthAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: OAUTH_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      provide: OAUTH_OPTIONS,
      useFactory: async (optionsFactory: OauthAsyncOptionsFactory) =>
        await optionsFactory.createOauthOptions(),
      inject: [options.useExisting || options.useClass ||''],
    };
  }
}
