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

import { KagentiAgentEntityProvider } from './providers/KagentiAgentEntityProvider';
import { KagentiToolEntityProvider } from './providers/KagentiToolEntityProvider';
import { KeycloakAuthClient } from '@red-hat-developer-hub/backstage-plugin-boost-node';
import type { KagentiEntityProviderConfig } from './types';

/**
 * Default upstream refresh interval for agent entities (5 minutes).
 */
const DEFAULT_AGENT_REFRESH_SECONDS = 300;

/**
 * Default upstream refresh interval for tool entities (5 minutes).
 */
const DEFAULT_TOOL_REFRESH_SECONDS = 300;

/**
 * Catalog backend module that registers Kagenti entity providers.
 *
 * Independently deployable as an RHDH dynamic plugin — emits AI agents
 * (kind: Component, spec.type: ai-agent) and tools (kind: Resource,
 * spec.type: ai-tool) as Backstage catalog entities without requiring
 * the full boost plugin.
 *
 * Configuration (app-config.yaml):
 * ```yaml
 * boost:
 *   entityProviders:
 *     kagenti:
 *       baseUrl: http://localhost:8080
 *       namespaces:
 *         - default
 *       agentRefreshIntervalSeconds: 300
 *       toolRefreshIntervalSeconds: 300
 * ```
 *
 * @public
 */
export const catalogModuleKagentiEntityProvider = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'kagenti-entity-provider',
  register(reg) {
    reg.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
      },
      async init({ catalog, config, logger, scheduler }) {
        logger.info('Initializing Kagenti entity providers');

        const providerConfig = readKagentiEntityProviderConfig(config);

        // Read auth config from boost.kagenti.auth.*
        const authConfig = readKagentiAuthConfig(config, logger);

        // Construct KeycloakAuthClient when all 3 auth fields are present
        let authClient: KeycloakAuthClient | undefined;
        if (authConfig) {
          authClient = new KeycloakAuthClient(
            authConfig,
            authConfig.tokenExpiryBufferSeconds,
          );
          logger.info(
            'Keycloak service-account auth configured for Kagenti entity providers',
          );
        }

        const agentRefreshSeconds =
          providerConfig.agentRefreshIntervalSeconds ??
          DEFAULT_AGENT_REFRESH_SECONDS;
        const toolRefreshSeconds =
          providerConfig.toolRefreshIntervalSeconds ??
          DEFAULT_TOOL_REFRESH_SECONDS;

        catalog.addEntityProvider(
          new KagentiAgentEntityProvider({
            config: providerConfig,
            logger,
            taskRunner: scheduler.createScheduledTaskRunner({
              frequency: { seconds: agentRefreshSeconds },
              timeout: { minutes: 5 },
            }),
            authClient,
          }),
        );

        catalog.addEntityProvider(
          new KagentiToolEntityProvider({
            config: providerConfig,
            logger,
            taskRunner: scheduler.createScheduledTaskRunner({
              frequency: { seconds: toolRefreshSeconds },
              timeout: { minutes: 5 },
            }),
            authClient,
          }),
        );

        logger.info(
          `Kagenti entity providers registered (agents: ${agentRefreshSeconds}s, tools: ${toolRefreshSeconds}s)`,
        );
      },
    });
  },
});

/**
 * Read Keycloak service-account auth config from app-config.yaml.
 * Returns the config only when all three required fields are present.
 */
function readKagentiAuthConfig(
  config: typeof coreServices.rootConfig extends { T: infer T } ? T : never,
  logger: { warn: (msg: string) => void },
):
  | {
      tokenEndpoint: string;
      clientId: string;
      clientSecret: string;
      tokenExpiryBufferSeconds?: number;
    }
  | undefined {
  const authConfig = config.getOptionalConfig('boost.kagenti.auth');
  if (!authConfig) {
    return undefined;
  }

  const tokenEndpoint = authConfig.getOptionalString('tokenEndpoint');
  const clientId = authConfig.getOptionalString('clientId');
  const clientSecret = authConfig.getOptionalString('clientSecret');
  const tokenExpiryBufferSeconds = authConfig.getOptionalNumber(
    'tokenExpiryBufferSeconds',
  );

  if (tokenEndpoint && clientId && clientSecret) {
    return { tokenEndpoint, clientId, clientSecret, tokenExpiryBufferSeconds };
  }

  const present = [
    tokenEndpoint && 'tokenEndpoint',
    clientId && 'clientId',
    clientSecret && 'clientSecret',
  ].filter(Boolean);
  if (present.length > 0) {
    const missing = ['tokenEndpoint', 'clientId', 'clientSecret'].filter(
      k => !present.includes(k),
    );
    logger.warn(
      `Partial Kagenti auth config: found ${present.join(', ')} but missing ${missing.join(', ')}. Auth disabled.`,
    );
  }

  return undefined;
}

/**
 * Read Kagenti entity provider configuration from app-config.yaml.
 */
function readKagentiEntityProviderConfig(
  config: typeof coreServices.rootConfig extends { T: infer T } ? T : never,
): KagentiEntityProviderConfig {
  // Try the entity-provider-specific config first
  const epConfig = config.getOptionalConfig('boost.entityProviders.kagenti');

  if (epConfig) {
    return {
      baseUrl: epConfig.getString('baseUrl'),
      namespaces: epConfig.getOptionalStringArray('namespaces'),
      agentRefreshIntervalSeconds: epConfig.getOptionalNumber(
        'agentRefreshIntervalSeconds',
      ),
      toolRefreshIntervalSeconds: epConfig.getOptionalNumber(
        'toolRefreshIntervalSeconds',
      ),
    };
  }

  // Fall back to the provider module config for composed mode
  const providerConfig = config.getOptionalConfig('boost.providers.kagenti');

  if (providerConfig) {
    return {
      baseUrl: providerConfig.getString('baseUrl'),
      namespaces: providerConfig.getOptionalStringArray('namespaces'),
    };
  }

  // Default to localhost
  return {
    baseUrl: 'http://localhost:8080',
  };
}
