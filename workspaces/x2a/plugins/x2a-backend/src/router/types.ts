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

import type {
  DiscoveryService,
  HttpAuthService,
  LoggerService,
  PermissionsService,
  RootConfigService,
} from '@backstage/backend-plugin-api';

import { x2aDatabaseServiceRef } from '../services/X2ADatabaseService';
import { kubeServiceRef } from '../services/KubeService';

export interface RouterDeps {
  httpAuth: HttpAuthService;
  discoveryApi: DiscoveryService;
  x2aDatabase: typeof x2aDatabaseServiceRef.T;
  kubeService: typeof kubeServiceRef.T;
  logger: LoggerService;
  permissionsSvc: PermissionsService;
  config: RootConfigService;
}
