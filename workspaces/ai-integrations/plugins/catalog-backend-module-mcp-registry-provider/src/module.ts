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
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node';
import { readMcpRegistryProviderConfig } from './config';
import { McpRegistryEntityProvider } from './provider';

/**
 * The mcp-registry-provider backend module for the catalog plugin.
 *
 * Registers a single entity provider that ingests MCP servers from
 * one configured MCP Registry into the catalog as `mcp-server` API
 * entities.
 *
 * @public
 */
export const catalogModuleMcpRegistryProvider = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'catalog-backend-module-mcp-registry-provider',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
      },
      async init({ catalog, config, logger, scheduler }) {
        const providerConfig = readMcpRegistryProviderConfig(config);

        if (!providerConfig) {
          logger.info(
            'catalog.providers.mcpRegistry not configured; ' +
              'MCP Registry provider is inactive.',
          );
          return;
        }

        const provider = new McpRegistryEntityProvider(providerConfig, logger);

        catalog.addEntityProvider(provider);

        const taskRunner = scheduler.createScheduledTaskRunner(
          providerConfig.schedule,
        );

        await taskRunner.run({
          id: 'mcp-registry-provider:refresh',
          fn: async () => {
            await provider.run();
          },
        });
      },
    });
  },
});
