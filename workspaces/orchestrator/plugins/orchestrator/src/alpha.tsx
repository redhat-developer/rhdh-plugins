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

/**
 * @packageDocumentation
 *
 * Alpha exports for the Orchestrator plugin (Backstage new frontend system).
 * Provides the plugin instance, pages, nav items, entity content, and translation module.
 */

import { discoveryApiRef, identityApiRef } from '@backstage/core-plugin-api';
import {
  ApiBlueprint,
  createApiFactory,
  createFrontendModule,
  createFrontendPlugin,
  NavItemBlueprint,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import { TranslationBlueprint } from '@backstage/plugin-app-react';
import { EntityContentBlueprint } from '@backstage/plugin-catalog-react/alpha';

import { orchestratorApiRef, OrchestratorClient } from './api';
import OrchestratorIcon from './components/OrchestratorIcon';
import {
  entityInstanceRouteRef,
  entityWorkflowRouteRef,
  executeWorkflowRouteRef,
  orchestratorRootRouteRef,
  workflowInstanceRouteRef,
  workflowRouteRef,
  workflowRunsRouteRef,
} from './routes';
import { orchestratorTranslations } from './translations';

const orchestratorPage = PageBlueprint.make({
  params: {
    path: '/orchestrator',
    routeRef: orchestratorRootRouteRef,
    noHeader: true,
    loader: () => import('./components/Router').then(m => <m.Router />),
  },
});

const orchestratorNavItem = NavItemBlueprint.make({
  params: {
    routeRef: orchestratorRootRouteRef,
    title: 'Orchestrator',
    icon: OrchestratorIcon,
  },
});

const orchestratorApi = ApiBlueprint.make({
  params: defineParams =>
    defineParams(
      createApiFactory({
        api: orchestratorApiRef,
        deps: {
          discoveryApi: discoveryApiRef,
          identityApi: identityApiRef,
        },
        factory: ({ discoveryApi, identityApi }) =>
          new OrchestratorClient({
            discoveryApi,
            identityApi,
          }),
      }),
    ),
});

/**
 * @alpha
 * @param entity - The entity to check if it has the orchestrator.io/workflows annotation
 * @returns True if the entity has the orchestrator.io/workflows annotation
 */
const isOrchestratorCatalogTabAvailable = (entity: {
  metadata?: { annotations?: Record<string, string> };
}) => Boolean(entity.metadata?.annotations?.['orchestrator.io/workflows']);

const orchestratorEntityContent = EntityContentBlueprint.make({
  name: 'workflows',
  params: {
    path: '/workflows',
    title: 'Workflows',
    filter: isOrchestratorCatalogTabAvailable,
    loader: () =>
      import('./components/catalogComponents/CatalogTab').then(m => (
        <m.OrchestratorCatalogTab />
      )),
  },
});

const orchestratorTranslation = TranslationBlueprint.make({
  params: {
    resource: orchestratorTranslations,
  },
});

/**
 * The Orchestrator plugin for the new frontend system.
 * @alpha
 */
export default createFrontendPlugin({
  pluginId: 'orchestrator',
  extensions: [
    orchestratorPage,
    orchestratorNavItem,
    orchestratorApi,
    orchestratorEntityContent,
  ],
  routes: {
    root: orchestratorRootRouteRef,
    workflow: workflowRouteRef,
    workflowRuns: workflowRunsRouteRef,
    workflowInstance: workflowInstanceRouteRef,
    executeWorkflow: executeWorkflowRouteRef,
    entityWorkflow: entityWorkflowRouteRef,
    entityInstance: entityInstanceRouteRef,
  },
  info: {
    packageJson: () => import('../package.json'),
  },
});

/**
 * A frontend module that registers Orchestrator translations.
 * Must be installed separately in the app's features since TranslationBlueprint
 * is restricted to the app plugin (pluginId: 'app').
 * @alpha
 */
export const orchestratorTranslationsModule = createFrontendModule({
  pluginId: 'app',
  extensions: [orchestratorTranslation],
});

export {
  orchestratorTranslationRef,
  orchestratorTranslations,
} from './translations';
