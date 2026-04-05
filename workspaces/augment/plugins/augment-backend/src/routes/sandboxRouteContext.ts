/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Router } from 'express';
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { KagentiSandboxClient } from '../providers/kagenti/client/KagentiSandboxClient';
import type { KagentiConfig } from '../providers/kagenti/config/KagentiConfigLoader';
import type { RouteContext } from './types';

/** Shared context for Kagenti sandbox sub-route modules. */
export interface SandboxRouteCtx {
  router: Router;
  logger: LoggerService;
  sandbox: KagentiSandboxClient;
  kagentiCfg: KagentiConfig;
  withRoute: ReturnType<typeof import('./routeWrapper').createWithRoute>;
  requireAdminAccess: RouteContext['requireAdminAccess'];
  checkIsAdmin: RouteContext['checkIsAdmin'];
  defaultLimit: number;
  maxLimit: number;
}
