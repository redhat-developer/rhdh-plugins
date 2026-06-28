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

import type { AgentCard, KagentiEntityProviderConfig } from '../types';
import {
  mapLifecycleStage,
  mapOwner,
  sanitizeEntityName,
} from './entityHelpers';
import { getKagentiBearerToken } from './kagentiAuth';

const PROVIDER_ID = 'kagenti-agent-entity-provider';

/**
 * Annotation key for the boost lifecycle stage.
 *
 * @internal
 */
export const ANNOTATION_BOOST_LIFECYCLE_STAGE =
  'boost.redhat.com/lifecycle-stage';

/**
 * Entity provider that polls the Kagenti API for agents and emits them
 * as Backstage catalog entities with kind: Component, spec.type: ai-agent.
 *
 * Implements the two-layer polling model: this provider refreshes its
 * upstream data on a configurable interval (default 5m), caching the
 * result. When Backstage's catalog infrastructure polls the provider,
 * it returns the cached data.
 *
 * @public
 */
export class KagentiAgentEntityProvider implements EntityProvider {
  private readonly config: KagentiEntityProviderConfig;
  private readonly logger: LoggerService;
  private readonly scheduleFn: () => Promise<void>;
  private connection?: EntityProviderConnection;
  private cachedEntities: Entity[] = [];

  constructor(options: {
    config: KagentiEntityProviderConfig;
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
   * Fetch agents from the Kagenti API and convert to catalog entities.
   * This is the upstream refresh — called on the configured interval.
   */
  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error('KagentiAgentEntityProvider not initialized');
    }

    this.logger.info(
      `Refreshing agent entities from Kagenti at ${this.config.baseUrl}`,
    );

    try {
      const agents = await this.fetchAgents();
      this.cachedEntities = agents.map(agent => this.agentToEntity(agent));

      this.logger.info(
        `Fetched ${this.cachedEntities.length} agent entities from Kagenti`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to fetch agents from Kagenti',
        error instanceof Error ? error : undefined,
      );
      // On error, keep serving previously cached entities
    }

    await this.connection.applyMutation({
      type: 'full',
      entities: this.cachedEntities.map(entity => ({
        entity,
        locationKey: PROVIDER_ID,
      })),
    });
  }

  /**
   * Fetch agent cards from the Kagenti API.
   */
  private async fetchAgents(): Promise<AgentCard[]> {
    const namespaces = this.config.namespaces ?? ['default'];
    const allAgents: AgentCard[] = [];

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.config.auth) {
      const token = await getKagentiBearerToken(this.config.auth);
      headers.Authorization = `Bearer ${token}`;
    }

    for (const ns of namespaces) {
      const url = `${this.config.baseUrl}/api/v1/agents?namespace=${encodeURIComponent(ns)}`;
      try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
          this.logger.warn(
            `Kagenti API returned ${response.status} for namespace ${ns}`,
          );
          continue;
        }
        const body = (await response.json()) as
          | { items: AgentCard[] }
          | AgentCard[];
        const agents = Array.isArray(body) ? body : (body.items ?? []);
        allAgents.push(
          ...agents.map(a => ({ ...a, namespace: a.namespace ?? ns })),
        );
      } catch (error) {
        this.logger.warn(
          `Failed to fetch agents for namespace ${ns}`,
          error instanceof Error ? error : undefined,
        );
      }
    }

    return allAgents;
  }

  /**
   * Convert a Kagenti agent card into a Backstage Component entity.
   */
  private agentToEntity(agent: AgentCard): Entity {
    const entityName = sanitizeEntityName(
      agent.namespace
        ? `kagenti-${agent.namespace}-${agent.id}`
        : `kagenti-${agent.id}`,
    );

    const annotations: Record<string, string> = {
      [ANNOTATION_LOCATION]: `${PROVIDER_ID}:${entityName}`,
      [ANNOTATION_ORIGIN_LOCATION]: `${PROVIDER_ID}:${entityName}`,
    };

    if (agent.lifecycleStage) {
      annotations[ANNOTATION_BOOST_LIFECYCLE_STAGE] = agent.lifecycleStage;
    }

    if (agent.url) {
      annotations['boost.redhat.com/a2a-url'] = agent.url;
    }

    if (agent.namespace) {
      annotations['boost.redhat.com/kagenti-namespace'] = agent.namespace;
    }

    return {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: entityName,
        title: agent.name,
        description: agent.description ?? `Kagenti agent: ${agent.name}`,
        annotations,
        labels: {
          'boost.redhat.com/provider': 'kagenti',
        },
      },
      spec: {
        type: 'ai-agent',
        lifecycle: mapLifecycleStage(agent.lifecycleStage),
        owner: mapOwner(agent.createdBy),
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
              'Error during Kagenti agent entity refresh',
              error instanceof Error ? error : undefined,
            );
          }
        },
      });
    };
  }
}
