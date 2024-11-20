/*
 * Copyright 2024 The Backstage Authors
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
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';

import { orchestratorApiRef, OrchestratorClient } from './api';
import { orchestratorRootRouteRef } from './routes';

/**
 * @public
 * Orchestrator Plugin
 */
export const orchestratorPlugin = createPlugin({
  id: 'orchestrator',
  apis: [
    createApiFactory({
      api: orchestratorApiRef,
      deps: { discoveryApi: discoveryApiRef, identityApi: identityApiRef },
      factory({ discoveryApi, identityApi }) {
        return new OrchestratorClient({ discoveryApi, identityApi });
      },
    }),
  ],
  routes: {
    root: orchestratorRootRouteRef,
  },
});

/**
 * @public
 * Orchestrator Page
 */
export const OrchestratorPage = orchestratorPlugin.provide(
  createRoutableExtension({
    name: 'OrchestratorPage',
    component: () => import('./components/Router').then(m => m.Router),
    mountPoint: orchestratorRootRouteRef,
  }),
);
