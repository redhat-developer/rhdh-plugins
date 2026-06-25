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
  LlamaStackEntityProviderConfig,
  LlamaStackModelListResponse,
  LlamaStackModelEntry,
} from '../types';
import { sanitizeEntityName } from './entityHelpers';

const PROVIDER_ID = 'llamastack-model-entity-provider';

/**
 * Entity provider that polls the Llama Stack /v1/models endpoint and emits
 * AI models as Backstage catalog entities with kind: Resource, spec.type: ai-model.
 *
 * Implements the two-layer polling model: refreshes upstream on a configurable
 * interval (default 60s), caching the result. When Backstage's catalog
 * infrastructure polls the provider, it returns the cached data.
 *
 * @public
 */
export class LlamaStackModelEntityProvider implements EntityProvider {
  private readonly config: LlamaStackEntityProviderConfig;
  private readonly logger: LoggerService;
  private readonly scheduleFn: () => Promise<void>;
  private connection?: EntityProviderConnection;
  private cachedEntities: Entity[] = [];

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
   * Fetch models from the Llama Stack API and convert to catalog entities.
   */
  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error('LlamaStackModelEntityProvider not initialized');
    }

    this.logger.info(
      `Refreshing model entities from Llama Stack at ${this.config.baseUrl}`,
    );

    try {
      const models = await this.fetchModels();
      this.cachedEntities = models.map(model => this.modelToEntity(model));

      this.logger.info(
        `Fetched ${this.cachedEntities.length} model entities from Llama Stack`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to fetch models from Llama Stack',
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
   * Fetch models from the /v1/models endpoint.
   */
  private async fetchModels(): Promise<LlamaStackModelEntry[]> {
    const url = `${this.config.baseUrl}/v1/models`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (this.config.apiKey) {
      headers.Authorization = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(
        `Llama Stack API returned ${response.status} from ${url}`,
      );
    }

    const body = (await response.json()) as LlamaStackModelListResponse;

    if (body.data && Array.isArray(body.data)) {
      return body.data;
    }

    // If the response is an array directly (some Llama Stack versions)
    if (Array.isArray(body)) {
      return body as unknown as LlamaStackModelEntry[];
    }

    return [];
  }

  /**
   * Convert a Llama Stack model entry into a Backstage Resource entity.
   */
  private modelToEntity(model: LlamaStackModelEntry): Entity {
    const entityName = sanitizeEntityName(`llamastack-model-${model.id}`);

    return {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Resource',
      metadata: {
        name: entityName,
        title: model.id,
        description: `Llama Stack model: ${model.id}`,
        annotations: {
          [ANNOTATION_LOCATION]: `${PROVIDER_ID}:${entityName}`,
          [ANNOTATION_ORIGIN_LOCATION]: `${PROVIDER_ID}:${entityName}`,
          'boost.redhat.com/model-id': model.id,
          ...(model.owned_by && {
            'boost.redhat.com/model-owned-by': model.owned_by,
          }),
        },
        labels: {
          'boost.redhat.com/provider': 'llamastack',
        },
      },
      spec: {
        type: 'ai-model',
        lifecycle: 'production',
        owner: model.owned_by ?? 'unknown',
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
              'Error during Llama Stack model entity refresh',
              error instanceof Error ? error : undefined,
            );
          }
        },
      });
    };
  }
}
