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
  OgxEntityProviderConfig,
  OgxModelListResponse,
  OgxModelEntry,
} from '../types';
import { mapOwner, sanitizeEntityName } from './entityHelpers';

const PROVIDER_ID = 'ogx-model-entity-provider';

/**
 * Entity provider that polls the OGX /v1/models endpoint and emits
 * the OGX server as a single AiModelServerAPI entity with all discovered
 * model names listed in spec.models.available.
 *
 * Implements the two-layer polling model: refreshes upstream on a configurable
 * interval (default 60s), caching the result. When Backstage's catalog
 * infrastructure polls the provider, it returns the cached data.
 *
 * @public
 */
export class OgxModelEntityProvider implements EntityProvider {
  private readonly config: OgxEntityProviderConfig;
  private readonly logger: LoggerService;
  private readonly scheduleFn: () => Promise<void>;
  private connection?: EntityProviderConnection;
  private cachedEntity: Entity | undefined;

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
   * Fetch models from the OGX API and emit as a single AiModelServerAPI entity.
   */
  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error('OgxModelEntityProvider not initialized');
    }

    this.logger.info(
      `Refreshing model server entity from OGX at ${this.config.baseUrl}`,
    );

    try {
      const models = await this.fetchModels();
      this.cachedEntity = this.modelsToServerEntity(models);

      this.logger.info(
        `Built model server entity with ${models.length} models from OGX`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to fetch models from OGX',
        error instanceof Error ? error : undefined,
      );
    }

    await this.connection.applyMutation({
      type: 'full',
      entities: this.cachedEntity
        ? [{ entity: this.cachedEntity, locationKey: PROVIDER_ID }]
        : [],
    });
  }

  /**
   * Fetch models from the /v1/models endpoint.
   */
  private async fetchModels(): Promise<OgxModelEntry[]> {
    const url = `${this.config.baseUrl}/v1/models`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (this.config.apiKey) {
      headers.Authorization = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`OGX API returned ${response.status} from ${url}`);
    }

    const body = (await response.json()) as OgxModelListResponse;

    if (body.data && Array.isArray(body.data)) {
      return body.data;
    }

    // If the response is an array directly (some OGX versions)
    if (Array.isArray(body)) {
      return body as unknown as OgxModelEntry[];
    }

    return [];
  }

  /**
   * Convert the OGX server + its models into a single AiModelServerAPI entity.
   */
  private modelsToServerEntity(models: OgxModelEntry[]): Entity {
    const entityName = sanitizeEntityName('ogx-model-server');
    const modelNames = models.map(m => m.id);
    const firstOwner = models.find(m => m.owned_by)?.owned_by;

    return {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'AiModelServerAPI',
      metadata: {
        name: entityName,
        title: 'OGX Model Server',
        description: `OGX model server at ${this.config.baseUrl} serving ${modelNames.length} models`,
        annotations: {
          [ANNOTATION_LOCATION]: `${PROVIDER_ID}:${entityName}`,
          [ANNOTATION_ORIGIN_LOCATION]: `${PROVIDER_ID}:${entityName}`,
        },
        labels: {
          'ai-catalog.rhdh.com/provider': 'ogx',
        },
      },
      spec: {
        type: 'ai-model-server',
        lifecycle: 'production',
        owner: mapOwner(firstOwner),
        serverType: 'openai-v1',
        serverUrl: this.config.baseUrl,
        models: {
          discoverable: true,
          available: modelNames,
        },
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
              'Error during OGX model entity refresh',
              error instanceof Error ? error : undefined,
            );
          }
        },
      });
    };
  }
}
