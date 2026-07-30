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
import { boostProviderExtensionPoint } from '@red-hat-developer-hub/backstage-plugin-boost-node';
import { ResponsesApiProviderFactory } from './provider/ResponsesApiProviderFactory';

/**
 * Llama Stack provider module for the boost plugin.
 *
 * Registers a ResponsesApiProvider via the boost extension point,
 * enabling Llama Stack as an AI backend. All caches use Backstage
 * cacheService (Decision 3).
 *
 * Install alongside the core boost plugin:
 *
 * ```ts
 * // packages/backend/src/index.ts
 * backend.add(import('@red-hat-developer-hub/backstage-plugin-boost-backend'));
 * backend.add(import('@red-hat-developer-hub/backstage-plugin-boost-backend-module-llamastack'));
 * ```
 *
 * @public
 */
export const boostModuleLlamastack = createBackendModule({
  pluginId: 'boost',
  moduleId: 'llamastack',
  register(reg) {
    reg.registerInit({
      deps: {
        providers: boostProviderExtensionPoint,
        config: coreServices.rootConfig,
        cache: coreServices.cache,
        logger: coreServices.logger,
      },
      async init({ providers, config, cache, logger }) {
        logger.info('Initializing Llama Stack provider module');

        const factory = new ResponsesApiProviderFactory({
          config,
          cache,
          logger,
        });

        const {
          provider,
          modelListCache,
          mcpAuthTokenCache,
          clientManager,
          sessionMap,
        } = factory.create();

        // Register the provider with the boost plugin
        providers.registerProvider(provider);

        logger.info(
          `Llama Stack provider registered (id: ${provider.descriptor.id})`,
        );
        logger.info(
          `Caches initialized: modelList (60s TTL), mcpAuthToken (dynamic TTL), ` +
            `clientManager (1h TTL), sessionMap (24h TTL)`,
        );

        // Log cache readiness (these are available for future route handlers)
        logger.debug(
          `ModelListCache: ready, ClientManager: ready, SessionMap: ready`,
        );

        // Suppress unused-variable warnings — these caches are initialized
        // and available for provider-internal operations. Future iterations
        // will wire them into route handlers and orchestration flows.
        void modelListCache;
        void mcpAuthTokenCache;
        void clientManager;
        void sessionMap;
      },
    });
  },
});
