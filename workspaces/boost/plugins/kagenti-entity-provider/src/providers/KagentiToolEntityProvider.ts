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

import type { KagentiEntityProviderConfig, KagentiTool } from '../types';
import {
  mapLifecycleStage,
  mapOwner,
  sanitizeEntityName,
  unwrapItems,
} from './entityHelpers';
import type { KeycloakAuthClient } from '@red-hat-developer-hub/backstage-plugin-boost-node';
import { ANNOTATION_BOOST_LIFECYCLE_STAGE } from './KagentiAgentEntityProvider';

const PROVIDER_ID = 'kagenti-tool-entity-provider';

/**
 * Entity provider that polls the Kagenti API for tools and emits them
 * as Backstage catalog entities with kind: Resource, spec.type: ai-tool.
 *
 * Implements the two-layer polling model: this provider refreshes its
 * upstream data on a configurable interval (default 5m), caching the
 * result. When Backstage's catalog infrastructure polls the provider,
 * it returns the cached data.
 *
 * @public
 */
export class KagentiToolEntityProvider implements EntityProvider {
  private readonly config: KagentiEntityProviderConfig;
  private readonly logger: LoggerService;
  private readonly authClient?: KeycloakAuthClient;
  private readonly scheduleFn: () => Promise<void>;
  private connection?: EntityProviderConnection;
  private cachedEntities: Entity[] = [];

  constructor(options: {
    config: KagentiEntityProviderConfig;
    logger: LoggerService;
    taskRunner: SchedulerServiceTaskRunner;
    authClient?: KeycloakAuthClient;
  }) {
    this.config = options.config;
    this.logger = options.logger.child({ target: this.getProviderName() });
    this.authClient = options.authClient;
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
   * Fetch tools from the Kagenti API and convert to catalog entities.
   */
  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error('KagentiToolEntityProvider not initialized');
    }

    this.logger.info(
      `Refreshing tool entities from Kagenti at ${this.config.baseUrl}`,
    );

    try {
      const tools = await this.fetchTools();
      this.cachedEntities = tools.map(tool => this.toolToEntity(tool));

      this.logger.info(
        `Fetched ${this.cachedEntities.length} tool entities from Kagenti`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to fetch tools from Kagenti',
        error instanceof Error ? error : undefined,
      );
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
   * Fetch tool configurations from the Kagenti API.
   */
  private async fetchTools(): Promise<KagentiTool[]> {
    const namespaces = this.config.namespaces ?? ['default'];
    const allTools: KagentiTool[] = [];

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.authClient) {
      const token = await this.authClient.getBearerToken();
      headers.Authorization = `Bearer ${token}`;
    }

    for (const ns of namespaces) {
      const url = `${this.config.baseUrl}/api/v1/tools?namespace=${encodeURIComponent(ns)}`;
      try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
          this.logger.warn(
            `Kagenti API returned ${response.status} for tools in namespace ${ns}`,
          );
          continue;
        }
        const data: unknown = await response.json();
        const tools = unwrapItems<KagentiTool>(data);
        allTools.push(
          ...tools.map(t => ({ ...t, namespace: t.namespace ?? ns })),
        );
      } catch (error) {
        this.logger.warn(
          `Failed to fetch tools for namespace ${ns}`,
          error instanceof Error ? error : undefined,
        );
      }
    }

    return allTools;
  }

  /**
   * Convert a Kagenti tool into a Backstage Resource entity.
   */
  private toolToEntity(tool: KagentiTool): Entity {
    const entityName = sanitizeEntityName(
      tool.namespace
        ? `kagenti-tool-${tool.namespace}-${tool.id}`
        : `kagenti-tool-${tool.id}`,
    );

    const annotations: Record<string, string> = {
      [ANNOTATION_LOCATION]: `${PROVIDER_ID}:${entityName}`,
      [ANNOTATION_ORIGIN_LOCATION]: `${PROVIDER_ID}:${entityName}`,
    };

    if (tool.lifecycleStage) {
      annotations[ANNOTATION_BOOST_LIFECYCLE_STAGE] = tool.lifecycleStage;
    }

    if (tool.namespace) {
      annotations['boost.redhat.com/kagenti-namespace'] = tool.namespace;
    }

    return {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Resource',
      metadata: {
        name: entityName,
        title: tool.name,
        description: tool.description ?? `Kagenti tool: ${tool.name}`,
        annotations,
        labels: {
          'boost.redhat.com/provider': 'kagenti',
        },
      },
      spec: {
        type: 'ai-tool',
        lifecycle: mapLifecycleStage(tool.lifecycleStage),
        owner: mapOwner(tool.createdBy),
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
              'Error during Kagenti tool entity refresh',
              error instanceof Error ? error : undefined,
            );
          }
        },
      });
    };
  }
}
