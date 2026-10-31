# NestJS Social Auth

Verify Google, Facebook and LinkedIn sign-ins on your NestJS backend.

## Table of Content

- [NestJS Social Auth](#nestjs-social-auth)
  - [Table of Content](#table-of-content)
  - [Introduction](#introduction)
  - [Installation](#installation)
  - [Getting Started](#getting-started)
    - [Static Registration](#static-registration)
    - [Recommended Way](#recommended-way)
  - [Client Configuration](#client-configuration)
    - [Google](#google)
    - [Facebook](#facebook)
    - [LinkedIn](#linkedin)
  - [Usage](#usage)
    - [Methods](#methods)
    - [Errors](#errors)
  - [Upgrading from 0.1.x](#upgrading-from-01x)
  - [License](#license)

## Introduction

Your frontend signs the user in with Google, Facebook or LinkedIn and sends the result (an ID token, an access token or an authorization code) to your API. This package checks it with the provider and returns the user's profile, so you can find or create the user in your database.

| Client     | Frontend sends            | What the package does                                                                                   |
| ---------- | ------------------------- | ------------------------------------------------------------------------------------------------------- |
| `google`   | ID token (`credential`)   | Verifies the JWT signature with Google's public keys, checks `iss`, `aud` (your client ID) and `exp`.  |
| `facebook` | User access token         | Checks with `debug_token` that the token is valid and was issued for your app, then reads `/me`.       |
| `linkedin` | Authorization code        | Exchanges the code for an access token and reads the OpenID Connect `userinfo` endpoint.               |

It calls the providers' HTTP APIs directly with Node's `fetch` and `node:crypto`; there are no runtime dependencies and no provider SDKs.

---

## Installation

```bash
# Using NPM
npm i @squareboat/nest-social-auth

# Using YARN
yarn add @squareboat/nest-social-auth
```

Requires Node.js 20.19+ or 22.12+ and NestJS 10, 11 or 12.

> The unscoped `nest-social-auth` package on npm (0.0.15 to 0.1.1) contains no code. Use `@squareboat/nest-social-auth`.

---

## Getting Started

To register `OauthModule` with your app, import the module inside `AppModule`. Configure only the clients you use.

#### Static Registration

```typescript
import { Module } from '@nestjs/common';
import { OauthModule } from '@squareboat/nest-social-auth';

@Module({
  imports: [
    OauthModule.register({
      default: 'google',
      clients: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
        },
        facebook: {
          clientId: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
        },
        linkedin: {
          clientId: process.env.LINKEDIN_CLIENT_ID,
          clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        },
      },
    }),
  ],
})
export class AppModule {}
```

`isGlobal: true` makes the module global. `Oauthorizer()` works from anywhere once the module is imported once, so you don't need it for the usage below.

#### Recommended Way

Use `ConfigModule` provided by NestJS to load configurations. To learn about `ConfigModule`, [click here](https://docs.nestjs.com/techniques/configuration).

**#1. Create `config/oauth.ts`**

```typescript
import { registerAs } from '@nestjs/config';
import { OauthOptions } from '@squareboat/nest-social-auth';

export default registerAs(
  'oauth',
  (): OauthOptions => ({
    default: 'google',
    clients: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
      },
      facebook: {
        clientId: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
      },
      linkedin: {
        clientId: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      },
    },
  }),
);
```

**#2. Register `ConfigModule` and `OauthModule`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OauthModule, OauthOptions } from '@squareboat/nest-social-auth';
import oauth from './config/oauth';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [oauth] }),
    OauthModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => config.getOrThrow<OauthOptions>('oauth'),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

`imports` lists modules (like `ConfigModule`), never providers such as `ConfigService`. `registerAsync()` also accepts `useClass` or `useExisting` with a class that implements `OauthOptionsFactory` (`createOauthOptions()`).

---

## Client Configuration

#### Google

```typescript
google: {
  clientId: process.env.GOOGLE_CLIENT_ID, // the OAuth client ID your frontend signs in with
}
```

Create an OAuth client ID in the [Google Cloud console](https://console.cloud.google.com/apis/credentials) and add [Sign In With Google](https://developers.google.com/identity/gsi/web/guides/overview) to your frontend. Send the `credential` it returns (an ID token) to your API.

The token is verified [the way Google recommends](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token): RS256 signature against Google's keys at `https://www.googleapis.com/oauth2/v3/certs` (cached as long as Google's `Cache-Control` header allows), `iss` is `accounts.google.com`, `aud` is your `clientId`, and the token has not expired (5 minutes clock skew allowed). `clientSecret` is not needed.

`getProfile()` returns the token's claims (`sub`, `email`, `email_verified`, `name`, `given_name`, `family_name`, `picture`, `hd`, ...). Use `sub` as the user's ID, check `email_verified` before you trust `email`, and check `hd` if only your Google Workspace domain may sign in.

#### Facebook

```typescript
facebook: {
  clientId: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  graphApiVersion: 'v26.0', // optional, this is the default
}
```

Create an app with [Facebook Login](https://developers.facebook.com/docs/facebook-login/) and send the user access token from the login (`authResponse.accessToken` in the JavaScript SDK) to your API.

The token is checked with [`debug_token`](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow): it must be valid, a user token, and issued for your app ID. A token the user gave to another Facebook app is rejected. The profile is then read from `/me?fields=id,name,email,picture` with `appsecret_proof`. The app secret never leaves your server.

`getProfile()` returns `id`, `name`, `email` and `picture`. `email` is missing if the user has no email address or did not grant the `email` permission.

#### LinkedIn

```typescript
linkedin: {
  clientId: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
}
```

Add the **Sign In with LinkedIn using OpenID Connect** product to your app in the [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps) and register your redirect URL. Send the user to LinkedIn's [authorization URL](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow) with `scope=openid profile email` and a `state` value, and check `state` when LinkedIn redirects back (this package does not build the URL or check `state`). Then send the `code` to your API.

`getAccessToken()` exchanges the code for an access token, and `getProfile()` reads [`/v2/userinfo`](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2): `sub`, `name`, `given_name`, `family_name`, `picture`, `locale`, `email`, `email_verified`.

Exchange the code on your server rather than accepting access tokens from the browser. `getProfile()` does not check which app an access token was issued for, so a token from another LinkedIn app would also work; a token you got from `getAccessToken()` with your client secret is always yours.

#### Other options

Each client also takes URL options, for a proxy or a local stand-in in tests:

| Client     | Option            | Default                                        |
| ---------- | ----------------- | ---------------------------------------------- |
| `google`   | `certsUrl`        | `https://www.googleapis.com/oauth2/v3/certs`   |
| `facebook` | `graphApiUrl`     | `https://graph.facebook.com`                   |
| `facebook` | `graphApiVersion` | `v26.0`                                        |
| `linkedin` | `tokenUrl`        | `https://www.linkedin.com/oauth/v2/accessToken` |
| `linkedin` | `userInfoUrl`     | `https://api.linkedin.com/v2/userinfo`         |

Apps still on LinkedIn's legacy "Sign In with LinkedIn" product (deprecated by LinkedIn on 1 August 2023) can set `userInfoUrl: 'https://api.linkedin.com/v2/me'` to get the old `/v2/me` response.

---

## Usage

Call `Oauthorizer()` with the client name (or without it for the `default` client). `Oauth.authorize()` does the same.

```typescript
import { Body, Controller, Post } from '@nestjs/common';
import { Oauthorizer } from '@squareboat/nest-social-auth';

@Controller('auth')
export class AuthController {
  @Post('google')
  async google(@Body('credential') credential: string) {
    const profile = await Oauthorizer('google').getProfile({ id_token: credential });
    // find or create the user by profile.sub, then issue your own session/JWT
    return { email: profile.email_verified ? profile.email : null };
  }

  @Post('facebook')
  async facebook(@Body('accessToken') accessToken: string) {
    return Oauthorizer('facebook').getProfile({ accessToken });
  }

  @Post('linkedin')
  async linkedin(@Body('code') code: string) {
    const linkedin = Oauthorizer('linkedin');
    const token = await linkedin.getAccessToken({
      code,
      redirect_uri: 'https://app.example.com/auth/linkedin/callback',
    });
    return linkedin.getProfile({ access_token: token.access_token });
  }
}
```

#### Methods

- `Oauthorizer('google').getProfile({ id_token })`: verify a Google ID token, returns `GoogleProfile`.
- `Oauthorizer('facebook').getProfile({ accessToken })`: verify a Facebook user access token, returns `FacebookProfile`.
- `Oauthorizer('linkedin').getAccessToken({ code, redirect_uri })`: exchange a LinkedIn authorization code, returns `LinkedinTokenResponse` (`access_token`, `expires_in`, `scope`, `id_token`).
- `Oauthorizer('linkedin').getProfile({ access_token })`: get the LinkedIn member's profile, returns `LinkedinProfile`.

#### Errors

- The provider rejected the token or code (invalid, expired, issued for another app or client ID): `UnauthorizedException`, so the request gets a 401.
- The provider could not be reached or answered with another error (5xx, rate limit): `OauthProviderError`, with `provider`, `status` and `body`.
- The client is not configured or its `clientId`/`clientSecret` is empty (for example a missing env var), or `OauthModule` is not imported: `Error`.

Error messages never contain the tokens or your secrets.

---

## Upgrading from 0.1.x

0.1.x was never published with its code, so this only matters if you used it from git.

- NestJS 10, 11 or 12 and Node.js 20.19+ / 22.12+ (was NestJS 6 or 7).
- Google: ID tokens are verified locally instead of with the `tokeninfo` endpoint, which Google says is not for production. The returned claims have their JSON types: `email_verified` is a boolean and `exp`/`iat` are numbers (they were strings). A token for another client ID throws `UnauthorizedException` (401) instead of `HttpException` 403.
- Facebook: the token must have been issued for your app. Graph API calls use `v26.0`.
- LinkedIn: `getProfile()` reads `/v2/userinfo` (OpenID Connect) instead of `/v2/me`; see `userInfoUrl` above for legacy apps. `getAccessToken()` now sends a form-encoded body, as LinkedIn requires.
- Rejected credentials throw `UnauthorizedException` instead of a generic `Error`.
- `registerAsync()` passes `imports` to Nest and registers the `useClass` class. List modules in `imports`, not providers such as `ConfigService`.
- The `twitter` client name is gone: there was never a Twitter client.

## License

This library is licensed under the MIT License.
