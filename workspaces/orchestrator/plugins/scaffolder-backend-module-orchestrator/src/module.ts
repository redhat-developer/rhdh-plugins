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
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node';

import {
  createGetWorkflowParamsAction,
  createRunWorkflowAction,
} from './actions';

/**
 * A backend module that registers the action into the scaffolder
 */
export const scaffolderModule = createBackendModule({
  moduleId: 'orchestrator',
  pluginId: 'scaffolder',
  register({ registerInit }) {
    registerInit({
      deps: {
        scaffolderActions: scaffolderActionsExtensionPoint,
        discoveryService: coreServices.discovery,
        authService: coreServices.auth,
      },
      async init({ scaffolderActions, discoveryService, authService }) {
        scaffolderActions.addActions(
          createRunWorkflowAction(discoveryService, authService),
        );
        scaffolderActions.addActions(
          createGetWorkflowParamsAction(discoveryService, authService),
        );
      },
    });
  },
});
