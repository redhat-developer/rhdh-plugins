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
  AuthService,
  DiscoveryService,
  LoggerService,
  PermissionsService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import type { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';
import type { CatalogService } from '@backstage/plugin-catalog-node';
import type {
  x2aDatabaseServiceRef,
  kubeServiceRef,
} from '@red-hat-developer-hub/backstage-plugin-x2a-backend';

import { createListProjectsAction } from './createListProjectsAction';
import { createCreateProjectAction } from './createCreateProjectAction';
import { createTriggerNextPhaseAction } from './createTriggerNextPhaseAction';

export { createListProjectsAction } from './createListProjectsAction';
export { createCreateProjectAction } from './createCreateProjectAction';
export { createTriggerNextPhaseAction } from './createTriggerNextPhaseAction';

export interface X2aActionsOptions {
  actionsRegistry: ActionsRegistryService;
  auth: AuthService;
  catalog: CatalogService;
  config: RootConfigService;
  discovery: DiscoveryService;
  kubeService: typeof kubeServiceRef.T;
  logger: LoggerService;
  permissionsSvc: PermissionsService;
  x2aDatabase: typeof x2aDatabaseServiceRef.T;
}

export function createX2aActions(options: X2aActionsOptions) {
  createListProjectsAction(options);
  createCreateProjectAction(options);
  createTriggerNextPhaseAction(options);
}
