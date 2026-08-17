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

import type {
  LoggerService,
  SchedulerServiceTaskRunner,
} from '@backstage/backend-plugin-api';
import type {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
} from '@backstage/catalog-model';
import type { Entity } from '@backstage/catalog-model';

import type { OgxAgentConfig, OgxEntityProviderConfig } from '../types';
import {
  mapLifecycleStage,
  mapOwner,
  sanitizeEntityName,
} from './entityHelpers';

const PROVIDER_ID = 'ogx-agent-entity-provider';

/**
 * Annotation key for the ai-catalog lifecycle stage.
 *
 * @internal
 */
export const ANNOTATION_AI_CATALOG_LIFECYCLE_STAGE =
  'ai-catalog.rhdh.com/lifecycle-stage';

/**
 * Entity provider that reads configured agents from YAML/admin config
 * and emits them as Backstage catalog entities with kind: AiResource,
 * spec.type: agent.
 *
 * Unlike the model provider which polls an API, agent configurations
 * come from app-config.yaml and are read once at init time.
 *
 * @public
 */
export class OgxAgentEntityProvider implements EntityProvider {
  private readonly config: OgxEntityProviderConfig;
  private readonly logger: LoggerService;
  private readonly scheduleFn: () => Promise<void>;
  private connection?: EntityProviderConnection;

  constructor(options: {
    config: OgxEntityProviderConfig;
    logger: LoggerService;
    taskRunner: SchedulerServiceTaskRunner;
  }) {
    this.config = options.config;
    this.logger = options.logger.child({ target: this.getProviderName() });
    this.scheduleFn = this.createScheduleFn(options.taskRunner);
  }

  getProviderName(): string {
    return PROVIDER_ID;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.scheduleFn();
  }

  /**
   * Read agent configs and emit as catalog entities.
   */
  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error('OgxAgentEntityProvider not initialized');
    }

    const agents = this.config.agents ?? [];

    this.logger.info(
      `Refreshing ${agents.length} agent entities from OGX config`,
    );

    const entities = agents.map(agent => this.agentToEntity(agent));

    await this.connection.applyMutation({
      type: 'full',
      entities: entities.map(entity => ({
        entity,
        locationKey: PROVIDER_ID,
      })),
    });
  }

  /**
   * Convert an OGX agent config into a Backstage AiResource entity.
   */
  private agentToEntity(agent: OgxAgentConfig): Entity {
    const entityName = sanitizeEntityName(`ogx-agent-${agent.id}`);

    const annotations: Record<string, string> = {
      [ANNOTATION_LOCATION]: `${PROVIDER_ID}:${entityName}`,
      [ANNOTATION_ORIGIN_LOCATION]: `${PROVIDER_ID}:${entityName}`,
    };

    if (agent.lifecycleStage) {
      annotations[ANNOTATION_AI_CATALOG_LIFECYCLE_STAGE] = agent.lifecycleStage;
    }

    if (agent.model) {
      annotations['ai-catalog.rhdh.com/model'] = agent.model;
    }

    // Build handoffs for agent-to-agent delegation targets
    const handoffs: string[] = [];
    if (agent.handoffs) {
      for (const target of agent.handoffs) {
        handoffs.push(
          `airesource:default/${sanitizeEntityName(`ogx-agent-${target}`)}`,
        );
      }
    }

    return {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'AiResource',
      metadata: {
        name: entityName,
        title: agent.name,
        description: agent.description ?? `OGX agent: ${agent.name}`,
        annotations,
        labels: {
          'ai-catalog.rhdh.com/provider': 'ogx',
        },
      },
      spec: {
        type: 'agent',
        lifecycle: mapLifecycleStage(agent.lifecycleStage),
        owner: mapOwner(agent.createdBy),
        instructions:
          agent.instructions ?? agent.description ?? `OGX agent: ${agent.name}`,
        ...(handoffs.length > 0 && { handoffs }),
        ...(agent.handoffDescription && {
          handoffDescription: agent.handoffDescription,
        }),
        ...(agent.enableRAG !== undefined && { enableRAG: agent.enableRAG }),
      },
    };
  }

  private createScheduleFn(
    taskRunner: SchedulerServiceTaskRunner,
  ): () => Promise<void> {
    return async () => {
      const taskId = `${this.getProviderName()}:refresh`;
      return taskRunner.run({
        id: taskId,
        fn: async () => {
          try {
            await this.run();
          } catch (error) {
            this.logger.error(
              'Error during OGX agent entity refresh',
              error instanceof Error ? error : undefined,
            );
          }
        },
      });
    };
  }
}
