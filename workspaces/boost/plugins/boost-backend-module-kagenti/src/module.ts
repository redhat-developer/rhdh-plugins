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
import { KagentiProviderFactory } from './provider/KagentiProviderFactory';

/**
 * Kagenti provider module for the boost plugin.
 *
 * Registers a KagentiProvider via the boost extension point,
 * enabling Kagenti as an AI backend via the A2A protocol. All
 * caches use Backstage cacheService (Decision 3).
 *
 * Install alongside the core boost plugin:
 *
 * ```ts
 * // packages/backend/src/index.ts
 * backend.add(import('@red-hat-developer-hub/backstage-plugin-boost-backend'));
 * backend.add(import('@red-hat-developer-hub/backstage-plugin-boost-backend-module-kagenti'));
 * ```
 *
 * @public
 */
export const boostModuleKagenti = createBackendModule({
  pluginId: 'boost',
  moduleId: 'kagenti',
  register(reg) {
    reg.registerInit({
      deps: {
        providers: boostProviderExtensionPoint,
        config: coreServices.rootConfig,
        cache: coreServices.cache,
        logger: coreServices.logger,
      },
      async init({ providers, config, cache, logger }) {
        logger.info('Initializing Kagenti provider module');

        const factory = new KagentiProviderFactory({
          config,
          cache,
          logger,
        });

        const { provider, agentCardCache, keycloakTokenCache, sessionMap } =
          factory.create();

        // Register the provider with the boost plugin
        providers.registerProvider(provider);

        logger.info(
          `Kagenti provider registered (id: ${provider.descriptor.id})`,
        );
        logger.info(
          `Caches initialized: agentCard (5m TTL), keycloakToken (dynamic TTL), ` +
            `sessionMap (24h TTL)`,
        );

        // Log cache readiness (these are available for future route handlers)
        logger.debug(
          `AgentCardCache: ready, KeycloakTokenCache: ready, SessionMap: ready`,
        );

        // Suppress unused-variable warnings — these caches are initialized
        // and available for provider-internal operations. Future iterations
        // will wire them into route handlers and orchestration flows.
        void agentCardCache;
        void keycloakTokenCache;
        void sessionMap;
      },
    });
  },
});
