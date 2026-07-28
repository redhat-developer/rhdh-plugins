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

import { LlamaStackModelEntityProvider } from './providers/LlamaStackModelEntityProvider';
import { LlamaStackAgentEntityProvider } from './providers/LlamaStackAgentEntityProvider';
import type {
  LlamaStackAgentConfig,
  LlamaStackEntityProviderConfig,
} from './types';

/**
 * Default upstream refresh interval for model entities (60 seconds).
 */
const DEFAULT_MODEL_REFRESH_SECONDS = 60;

/**
 * Default upstream refresh interval for agent entities (5 minutes).
 */
const DEFAULT_AGENT_REFRESH_SECONDS = 300;

/**
 * Catalog backend module that registers Llama Stack entity providers.
 *
 * Independently deployable as an RHDH dynamic plugin — emits AI models
 * (kind: Resource, spec.type: ai-model) and agents (kind: Component,
 * spec.type: ai-agent) as Backstage catalog entities without requiring
 * the full boost plugin.
 *
 * Configuration (app-config.yaml):
 * ```yaml
 * boost:
 *   entityProviders:
 *     llamastack:
 *       baseUrl: http://localhost:8321
 *       apiKey: ${LLAMA_STACK_API_KEY}  # optional
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
export const catalogModuleLlamaStackEntityProvider = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'llamastack-entity-provider',
  register(reg) {
    reg.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
      },
      async init({ catalog, config, logger, scheduler }) {
        logger.info('Initializing Llama Stack entity providers');

        const providerConfig = readLlamaStackEntityProviderConfig(config);

        const modelRefreshSeconds =
          providerConfig.modelRefreshIntervalSeconds ??
          DEFAULT_MODEL_REFRESH_SECONDS;
        const agentRefreshSeconds =
          providerConfig.agentRefreshIntervalSeconds ??
          DEFAULT_AGENT_REFRESH_SECONDS;

        catalog.addEntityProvider(
          new LlamaStackModelEntityProvider({
            config: providerConfig,
            logger,
            taskRunner: scheduler.createScheduledTaskRunner({
              frequency: { seconds: modelRefreshSeconds },
              timeout: { minutes: 3 },
            }),
          }),
        );

        catalog.addEntityProvider(
          new LlamaStackAgentEntityProvider({
            config: providerConfig,
            logger,
            taskRunner: scheduler.createScheduledTaskRunner({
              frequency: { seconds: agentRefreshSeconds },
              timeout: { minutes: 5 },
            }),
          }),
        );

        logger.info(
          `Llama Stack entity providers registered (models: ${modelRefreshSeconds}s, agents: ${agentRefreshSeconds}s)`,
        );
      },
    });
  },
});

/**
 * Read Llama Stack entity provider configuration from app-config.yaml.
 */
function readLlamaStackEntityProviderConfig(
  config: typeof coreServices.rootConfig extends { T: infer T } ? T : never,
): LlamaStackEntityProviderConfig {
  // Try the entity-provider-specific config first
  const epConfig = config.getOptionalConfig('boost.entityProviders.llamastack');

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
      agents: readAgentConfigs(epConfig),
    };
  }

  // Fall back to the provider module config for composed mode
  const providerConfig = config.getOptionalConfig('boost.providers.llamastack');

  if (providerConfig) {
    return {
      baseUrl: providerConfig.getString('baseUrl'),
      apiKey: providerConfig.getOptionalString('apiKey'),
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
): LlamaStackAgentConfig[] | undefined {
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
    model: agentConfig.getOptionalString('model'),
    tools: agentConfig.getOptionalStringArray('tools'),
    handoffTargets: agentConfig.getOptionalStringArray('handoffTargets'),
    createdBy: agentConfig.getOptionalString('createdBy'),
    lifecycleStage: agentConfig.getOptionalString('lifecycleStage') as
      | 'draft'
      | 'pending'
      | 'published'
      | 'archived'
      | undefined,
  }));
}
