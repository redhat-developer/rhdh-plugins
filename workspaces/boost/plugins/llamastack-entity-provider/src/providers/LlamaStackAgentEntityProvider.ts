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

import type {
  LlamaStackAgentConfig,
  LlamaStackEntityProviderConfig,
} from '../types';
import {
  mapLifecycleStage,
  mapOwner,
  sanitizeEntityName,
} from './entityHelpers';

const PROVIDER_ID = 'llamastack-agent-entity-provider';

/**
 * Annotation key for the boost lifecycle stage.
 *
 * @internal
 */
export const ANNOTATION_BOOST_LIFECYCLE_STAGE =
  'boost.redhat.com/lifecycle-stage';

/**
 * Entity provider that reads configured agents from YAML/admin config
 * and emits them as Backstage catalog entities with kind: Component,
 * spec.type: ai-agent.
 *
 * Unlike the model provider which polls an API, agent configurations
 * come from app-config.yaml. The provider re-reads config on each
 * refresh cycle to pick up hot-reloaded config changes.
 *
 * @public
 */
export class LlamaStackAgentEntityProvider implements EntityProvider {
  private readonly config: LlamaStackEntityProviderConfig;
  private readonly logger: LoggerService;
  private readonly scheduleFn: () => Promise<void>;
  private connection?: EntityProviderConnection;

  constructor(options: {
    config: LlamaStackEntityProviderConfig;
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
      throw new Error('LlamaStackAgentEntityProvider not initialized');
    }

    const agents = this.config.agents ?? [];

    this.logger.info(
      `Refreshing ${agents.length} agent entities from Llama Stack config`,
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
   * Convert a Llama Stack agent config into a Backstage Component entity.
   */
  private agentToEntity(agent: LlamaStackAgentConfig): Entity {
    const entityName = sanitizeEntityName(`llamastack-agent-${agent.id}`);

    const annotations: Record<string, string> = {
      [ANNOTATION_LOCATION]: `${PROVIDER_ID}:${entityName}`,
      [ANNOTATION_ORIGIN_LOCATION]: `${PROVIDER_ID}:${entityName}`,
    };

    if (agent.lifecycleStage) {
      annotations[ANNOTATION_BOOST_LIFECYCLE_STAGE] = agent.lifecycleStage;
    }

    if (agent.model) {
      annotations['boost.redhat.com/model'] = agent.model;
    }

    // Build dependsOn relations for tools and handoff targets
    const dependsOn: string[] = [];
    if (agent.tools) {
      for (const tool of agent.tools) {
        dependsOn.push(
          `resource:default/${sanitizeEntityName(`llamastack-tool-${tool}`)}`,
        );
      }
    }
    if (agent.handoffTargets) {
      for (const target of agent.handoffTargets) {
        dependsOn.push(
          `component:default/${sanitizeEntityName(`llamastack-agent-${target}`)}`,
        );
      }
    }

    return {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: entityName,
        title: agent.name,
        description: agent.description ?? `Llama Stack agent: ${agent.name}`,
        annotations,
        labels: {
          'boost.redhat.com/provider': 'llamastack',
        },
      },
      spec: {
        type: 'ai-agent',
        lifecycle: mapLifecycleStage(agent.lifecycleStage),
        owner: mapOwner(agent.createdBy),
        ...(dependsOn.length > 0 && { dependsOn }),
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
              'Error during Llama Stack agent entity refresh',
              error instanceof Error ? error : undefined,
            );
          }
        },
      });
    };
  }
}
