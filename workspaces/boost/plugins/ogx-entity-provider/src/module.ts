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

import { OgxModelEntityProvider } from './providers/OgxModelEntityProvider';
import { OgxAgentEntityProvider } from './providers/OgxAgentEntityProvider';
import type { OgxAgentConfig, OgxEntityProviderConfig } from './types';

/**
 * Default upstream refresh interval for model entities (60 seconds).
 */
const DEFAULT_MODEL_REFRESH_SECONDS = 60;

/**
 * Default upstream refresh interval for agent entities (5 minutes).
 */
const DEFAULT_AGENT_REFRESH_SECONDS = 300;

/**
 * Catalog backend module that registers OGX entity providers.
 *
 * Independently deployable as an RHDH dynamic plugin — emits a model
 * server entity (kind: AiModelServerAPI, spec.type: ai-model-server)
 * and agents (kind: AiResource, spec.type: agent) as Backstage catalog
 * entities without requiring the full boost plugin.
 *
 * Configuration (app-config.yaml):
 * ```yaml
 * boost:
 *   entityProviders:
 *     ogx:
 *       baseUrl: http://localhost:8321
 *       apiKey: ${OGX_API_KEY}  # optional
 *       modelRefreshIntervalSeconds: 60
 *       agentRefreshIntervalSeconds: 300
 *       agents:
 *         - id: my-agent
 *           name: My Agent
 *           model: meta-llama/Llama-3.1-8B-Instruct
 * ```
 *
 * @public
 */
export const catalogModuleOgxEntityProvider = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'ogx-entity-provider',
  register(reg) {
    reg.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
      },
      async init({ catalog, config, logger, scheduler }) {
        logger.info('Initializing OGX entity providers');

        const providerConfig = readOgxEntityProviderConfig(config);

        const modelRefreshSeconds =
          providerConfig.modelRefreshIntervalSeconds ??
          DEFAULT_MODEL_REFRESH_SECONDS;
        const agentRefreshSeconds =
          providerConfig.agentRefreshIntervalSeconds ??
          DEFAULT_AGENT_REFRESH_SECONDS;

        catalog.addEntityProvider(
          new OgxModelEntityProvider({
            config: providerConfig,
            logger,
            taskRunner: scheduler.createScheduledTaskRunner({
              frequency: { seconds: modelRefreshSeconds },
              timeout: { minutes: 3 },
            }),
          }),
        );

        catalog.addEntityProvider(
          new OgxAgentEntityProvider({
            config: providerConfig,
            logger,
            taskRunner: scheduler.createScheduledTaskRunner({
              frequency: { seconds: agentRefreshSeconds },
              timeout: { minutes: 5 },
            }),
          }),
        );

        logger.info(
          `OGX entity providers registered (models: ${modelRefreshSeconds}s, agents: ${agentRefreshSeconds}s)`,
        );
      },
    });
  },
});

/**
 * Read OGX entity provider configuration from app-config.yaml.
 */
function readOgxEntityProviderConfig(
  config: typeof coreServices.rootConfig extends { T: infer T } ? T : never,
): OgxEntityProviderConfig {
  // Try the entity-provider-specific config first
  const epConfig = config.getOptionalConfig('boost.entityProviders.ogx');

  if (epConfig) {
    return {
      baseUrl: epConfig.getString('baseUrl'),
      apiKey: epConfig.getOptionalString('apiKey'),
      modelRefreshIntervalSeconds: epConfig.getOptionalNumber(
        'modelRefreshIntervalSeconds',
      ),
      agentRefreshIntervalSeconds: epConfig.getOptionalNumber(
        'agentRefreshIntervalSeconds',
      ),
      defaultAgent: epConfig.getOptionalString('defaultAgent'),
      maxAgentTurns: epConfig.getOptionalNumber('maxAgentTurns'),
      agents: readAgentConfigs(epConfig),
    };
  }

  // Fall back to the provider module config for composed mode
  const providerConfig = config.getOptionalConfig('boost.providers.ogx');

  if (providerConfig) {
    return {
      baseUrl: providerConfig.getString('baseUrl'),
      apiKey: providerConfig.getOptionalString('apiKey'),
      defaultAgent: providerConfig.getOptionalString('defaultAgent'),
      maxAgentTurns: providerConfig.getOptionalNumber('maxAgentTurns'),
      agents: readAgentConfigs(providerConfig),
    };
  }

  // Default to localhost
  return {
    baseUrl: 'http://localhost:8321',
  };
}

/**
 * Read agent configurations from a config block.
 */
function readAgentConfigs(
  parentConfig: ReturnType<
    (typeof coreServices.rootConfig extends { T: infer T }
      ? T
      : never)['getOptionalConfig']
  >,
): OgxAgentConfig[] | undefined {
  if (!parentConfig) {
    return undefined;
  }

  const agentConfigs = parentConfig.getOptionalConfigArray('agents');
  if (!agentConfigs) {
    return undefined;
  }

  return agentConfigs.map(agentConfig => ({
    id: agentConfig.getString('id'),
    name: agentConfig.getString('name'),
    description: agentConfig.getOptionalString('description'),
    instructions: agentConfig.getOptionalString('instructions'),
    model: agentConfig.getOptionalString('model'),
    tools: agentConfig.getOptionalStringArray('tools'),
    handoffs: agentConfig.getOptionalStringArray('handoffs'),
    handoffDescription: agentConfig.getOptionalString('handoffDescription'),
    enableRAG: agentConfig.has('enableRAG')
      ? String(agentConfig.getOptional('enableRAG')) === 'true'
      : undefined,
    createdBy: agentConfig.getOptionalString('createdBy'),
    lifecycleStage: agentConfig.getOptionalString('lifecycleStage') as
      | 'draft'
      | 'pending'
      | 'published'
      | 'archived'
      | undefined,
  }));
}
