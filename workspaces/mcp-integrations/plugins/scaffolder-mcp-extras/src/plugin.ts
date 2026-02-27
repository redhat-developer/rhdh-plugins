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
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { ScmIntegrations } from '@backstage/integration';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { actionsRegistryServiceRef } from '@backstage/backend-plugin-api/alpha';
import { createScaffolderActions } from './actions';

/**
 * mcpScaffolderExtrasPlugin backend plugin
 *
 * @public
 */
export const mcpScaffolderExtrasPlugin = createBackendPlugin({
  pluginId: 'scaffolder-mcp-extras',
  register(env) {
    env.registerInit({
      deps: {
        actionsRegistry: actionsRegistryServiceRef,
        auth: coreServices.auth,
        catalog: catalogServiceRef,
        config: coreServices.rootConfig,
        discovery: coreServices.discovery,
        logger: coreServices.logger,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
      },
      async init({
        actionsRegistry,
        auth,
        catalog,
        config,
        discovery,
        logger,
      }) {
        const scmIntegrations = ScmIntegrations.fromConfig(config);
        createScaffolderActions({
          actionsRegistry,
          auth,
          catalog,
          discovery,
          logger,
          scmIntegrations,
        });
      },
    });
  },
});
