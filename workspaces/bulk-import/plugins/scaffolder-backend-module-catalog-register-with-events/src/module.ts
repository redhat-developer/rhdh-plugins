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
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { createCatalogRegisterWithEventAction } from './actions/register';
import { ScmIntegrations } from '@backstage/integration';
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';
import { eventsServiceRef } from '@backstage/plugin-events-node';
import { Config } from '@backstage/config';

/**
 * @public
 * The Catalog Module for the Scaffolder Backend
 */
export const catalogModule = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'catalog-register-with-event',
  register({ registerInit }) {
    registerInit({
      deps: {
        scaffolder: scaffolderActionsExtensionPoint,
        events: eventsServiceRef,
        catalog: catalogServiceRef,
        config: coreServices.rootConfig,
      },
      async init({ scaffolder, events, catalog, config }) {
        const integrations = ScmIntegrations.fromConfig(config as Config);
        scaffolder.addActions(
          createCatalogRegisterWithEventAction({
            catalog: catalog,
            events,
            integrations,
          }),
        );
      },
    });
  },
});
