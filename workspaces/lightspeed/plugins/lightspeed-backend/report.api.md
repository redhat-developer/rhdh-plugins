## API Report File for "@red-hat-developer-hub/backstage-plugin-lightspeed-backend"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { BackendFeature } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import express from 'express';
import type { HttpAuthService } from '@backstage/backend-plugin-api';
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { PermissionsService } from '@backstage/backend-plugin-api';
import type { UserInfoService } from '@backstage/backend-plugin-api';

// @public
export function createRouter(options: RouterOptions): Promise<express.Router>;

// @public
const lightspeedPlugin: BackendFeature;
export default lightspeedPlugin;

// @public
export type RouterOptions = {
    logger: LoggerService;
    config: Config;
    httpAuth: HttpAuthService;
    userInfo: UserInfoService;
    permissions: PermissionsService;
};

// (No @packageDocumentation comment for this package)

```
