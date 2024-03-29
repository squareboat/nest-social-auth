# NestJS Social login

A mult-disk mult-driver social authentication manager for NestJS. 

## Table of Content

- [NestJS Social login](#nest-social-login)
  - [Table of Content](#table-of-content)
  - [Introduction](#introduction)
  - [Installation](#installation)
  - [Getting Started](#getting-started)
    - [Static Registration](#static-registration)
    - [Recommended Way](#recommended-way)
  - [Driver Configuration](#driver-configuration)
    - [Facebook](#facebook)
    - [Google](#google)
    - [Linkedin](#linkedin)
  - [Usage](#usage)
    - [Methods](#methods)
  - [License](#license)

## Introduction

This library provides functionality for validating social authentication credentials for Facebook, Google, and LinkedIn. It can be used in the backend of your application to ensure that the credentials provided by the user are valid and can be used to authenticate with the respective social media platforms.

---

## Installation

```python
#Using NPM
npm i nest-social-auth

#Using YARN
yarn i nest-social-auth
```

---

## Getting Started

To register `OauthModule` with your app, import the module inside `AppModule`.

#### Static Registration

> `OauthModule` is added to global scope by default.

```typescript
import { Module } from '@nestjs/common';
import { OauthModule } from 'nest-social-auth'

@Module({
  imports: [
    OauthModule.register({
      isGlobal: true,
      default: 'facebook',
      clients: {
        facebook: {
            clientId:process.env.FACEBOOK_APP_ID,
            clientSecret:process.env.FACEBOOK_APP_SECRET
        },
        google: {
          clientId:process.env.GOOGLE_CLIENT_ID,
          clientSecret:process.env.GOOGLE_CLIENT_SECRET
      },
      linkedin: {
          clientId:process.env.LINKEDIN_CLIENT_ID,
          clientSecret:process.env.LINKEDIN_CLIENT_SECRET
      }
    })
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
```

#### Recommended Way

Use `ConfigModule` provided by NestJS to load configurations. To learn about `ConfigModule`, [click here](https://docs.nestjs.com/techniques/configuration).

**#1. Create filesystem.ts file**

```typescript
import { registerAs } from "@nestjs/config";
import { OauthOptions } from "libs/oauth/src/interfaces";

export default registerAs(
  "oauth",
  () =>
    ({
      isGlobal: true,
      default: "facebook",
      clients: {
        facebook: {
          clientId: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
        },
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
        linkedin: {
          clientId: process.env.LINKEDIN_CLIENT_ID,
          clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        },
      },
    } as OauthOptions)
);
```

**#2. Register ConfigModule**

```typescript
import { Module } from "@nestjs/common";
import filesystem from "@config/fileystem";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [filesystem],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

**#3. Register Async StorageModule**
Add following snippet to the `imports` array. `ConfigService` is importable from `@nestjs/config` module.

```typescript
OauthModule.registerAsync({
  isGlobal: true,
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => config.get("oauth"),
  inject: [ConfigService],
});
```

---

## Driver Configuration

The best part about this package is the simplicity that it provides while working across different social login platforms. Every driver follow a simple and consistent API.

> Currently the package supports login authentication for facebook,google and linkedin.

**Driver Name:** `Facebook`

**Configuration:**

```typescript
{
    clientId:process.env.FACEBOOK_APP_ID,
    clientSecret:process.env.FACEBOOK_APP_SECRET
    }
```

`facebook` driver expects two parameters to authenticate a token. You can get the `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` by creating a developer account at facebook and enabling auth 2.0. Learn more about it [here](https://developers.facebook.com/docs/facebook-login/).

**Driver Name:** `Google`

**Configuration:**

```typescript
{
    clientId:process.env.GOOGLE_APP_ID,
    clientSecret:process.env.GOOGLE_APP_SECRET
    }
```

`google` driver expects two parameters to authenticate a token. You can get the `GOOGLE_APP_ID`, `GOOGLE_APP_SECRET` by creating a developer account at google and enabling auth 2.0. Learn more about it [here](https://developers.google.com/identity/sign-in/web/sign-in).

**Driver Name:** `Linkedin`

**Configuration:**

```typescript
{
    clientId:process.env.LINKEDIN_APP_ID,
    clientSecret:process.env.LINKEDIN_APP_SECRET
    }
```

`linkedin` driver expects two parameters to authenticate a token. You can get the `LINKEDIN_APP_ID`, `LINKEDIN_APP_SECRET` by creating a developer account at linkedin and enabling auth 2.0. Learn more about it [here](https://developer.linkedin.com/).

To serve the file objects from your project, have a look at [serve-static](https://docs.nestjs.com/recipes/serve-static) module by NestJS.

---
m
--- 

## Usage

This package provides a single and uniform API for any type of operation across different drivers.
You just have to Call the function Oauthorizer and pass the name of social platform and use thr methods provided. 


```typescript
Oauthorizer('google').getProfile({id_token:''})
Oauthorizer('facebook').getProfile({accessToken:''})
Oauthorizer('linkedin').getProfile({code:''})


```

#### Methods

- `getProfile(payload: CredentialsPayload)`: Get user profile from token.

- `getAccessToken(payload: ProfileParams)`: Get the access token for linkedin.

### License
This library is licensed under the MIT License.
