import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { OAUTH_OPTIONS } from './constants';
import {
  OauthAsyncOptions,
  OauthOptions,
  OauthOptionsFactory,
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
      imports: options.imports || [],
      providers: [
        this.createOauthOptionsProvider(options),
        ...(options.useClass
          ? [{ provide: options.useClass, useClass: options.useClass }]
          : []),
        OauthService,
        OauthMetadata,
      ],
    };
  }

  private static createOauthOptionsProvider(
    options: OauthAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: OAUTH_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    const inject = [
      (options.useClass || options.useExisting) as Type<OauthOptionsFactory>,
    ];
    return {
      provide: OAUTH_OPTIONS,
      useFactory: async (optionsFactory: OauthOptionsFactory) =>
        await optionsFactory.createOauthOptions(),
      inject,
    };
  }
}
