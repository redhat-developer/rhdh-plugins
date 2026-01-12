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
  SchedulerService,
  SchedulerServiceTaskRunner,
} from '@backstage/backend-plugin-api';
import {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
  Entity,
} from '@backstage/catalog-model';

import {
  fetchModelCatalogFromKey,
  fetchModelCatalogKeys,
} from '../clients/BridgeResourceConnector';
import { ModelCatalogConfig } from './types';
import { readModelCatalogApiEntityConfigs } from './config';
import type { Config } from '@backstage/config';
import { InputError, isError } from '@backstage/errors';
import { GenerateCatalogEntities } from '../clients/ModelCatalogGenerator';
/**
 * Provides entities from the model catalog service, allowing models and model servers to be imported into RHDH
 *
 * @public
 */
export class ModelCatalogResourceEntityProvider implements EntityProvider {
  private readonly env: string;
  private readonly baseUrl: string;
  private readonly logger: LoggerService;
  private readonly scheduleFn: () => Promise<void>;
  private connection?: EntityProviderConnection;

  /**
   * Fetches the configuration values specified for the entity provider in the app-config.yaml
   * @public
   */
  static fromConfig(
    deps: {
      config: Config;
      logger: LoggerService;
    },
    options:
      | { schedule: SchedulerServiceTaskRunner }
      | { scheduler: SchedulerService },
  ): ModelCatalogResourceEntityProvider[] {
    const { config, logger } = deps;

    const providerConfigs = readModelCatalogApiEntityConfigs(config);

    return providerConfigs.map(providerConfig => {
      let taskRunner;
      if ('scheduler' in options && providerConfig.schedule) {
        taskRunner = options.scheduler.createScheduledTaskRunner(
          providerConfig.schedule,
        );
      } else if ('schedule' in options) {
        taskRunner = options.schedule;
      } else {
        throw new InputError(
          `No schedule provided via config for ModelCatalogResourceEntityProvider:${providerConfig.id}.`,
        );
      }

      return new ModelCatalogResourceEntityProvider(
        providerConfig,
        logger,
        taskRunner,
      );
    });
  }
  /** [1]: Set configuration values passed into the entity provider. Fields are defined in types.ts */
  private constructor(
    config: ModelCatalogConfig,
    logger: LoggerService,
    taskRunner: SchedulerServiceTaskRunner,
  ) {
    this.env = config.id;
    this.baseUrl = config.baseUrl;
    this.logger = logger.child({
      target: this.getProviderName(),
    });
    this.scheduleFn = this.createScheduleFn(taskRunner);
  }

  /** Configure the schedule function and its logger */
  createScheduleFn(
    taskRunner: SchedulerServiceTaskRunner,
  ): () => Promise<void> {
    return async () => {
      const taskId = `${this.getProviderName()}:run`;
      return taskRunner.run({
        id: taskId,
        fn: async () => {
          try {
            await this.run();
          } catch (error) {
            if (isError(error)) {
              // Ensure that we don't log any sensitive internal data:
              this.logger.error(
                `Error while syncing resources from Model Catalog ${this.baseUrl}`,
                {
                  // Default Error properties:
                  name: error.name,
                  message: error.message,
                  stack: error.stack,
                  // Additional status code if available:
                  status: (error.response as { status?: string })?.status,
                },
              );
            }
          }
        },
      });
    };
  }

  /** [2]: Model Catalog entity provider must have a unique name */
  getProviderName(): string {
    return `ModelCatalogResourceEntityProvider:${this.env}`;
  }

  /** [3]: Connect Backstage catalog engine to ModelCatalogEntityProvider */
  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.scheduleFn();
  }

  /** [4]: Define the function that the entity provider will execute on a set schedule */
  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error('Not initialized');
    }
    this.logger.info(
      `Discovering ResourceEntities from Model Server ${this.baseUrl}`,
    );

    /** [5]: Fetch the model catalog keys from the bridge and fetch the corresponding catalog entries. */
    let catalogKeys = await fetchModelCatalogKeys(this.baseUrl);
    // If no models are registered yet, the catalogKeys array may be null, so handle it by setting it to be an emptyList
    if (catalogKeys === null || catalogKeys === undefined) {
      catalogKeys = [];
    }
    let entityList: Entity[] = [];
    this.logger.debug(`Found ${catalogKeys.length} model catalogs`);
    this.logger.debug(`Fetched ModelCatalog: ${JSON.stringify(catalogKeys)}`);

    await Promise.all(
      catalogKeys.map(async key => {
        const catalog = await fetchModelCatalogFromKey(this.baseUrl, key);
        const catalogEntities = GenerateCatalogEntities(catalog);
        entityList = entityList.concat(catalogEntities);
      }),
    );

    entityList.forEach(entity => {
      if (entity.metadata.annotations === undefined) {
        entity.metadata.annotations = {
          [ANNOTATION_LOCATION]: this.getProviderName(),
          [ANNOTATION_ORIGIN_LOCATION]: this.getProviderName(),
        };
      } else {
        entity.metadata.annotations[ANNOTATION_LOCATION] =
          this.getProviderName();
        entity.metadata.annotations[ANNOTATION_ORIGIN_LOCATION] =
          this.getProviderName();
      }
    });
    this.logger.debug(`Found ${entityList.length} entities`);
    this.logger.debug(`Fetched Entities: ${JSON.stringify(entityList)}`);
    /** [6]: Add/update the catalog entities that correspond to the models */
    await this.connection.applyMutation({
      type: 'full',
      entities: entityList.map(entity => ({
        entity,
        locationKey: this.getProviderName(),
      })),
    });
  }

  /* private getEntityLocationRef(entity: LocationEntityV1alpha1): string {
    const ref = entity.metadata.annotations?.[ANNOTATION_LOCATION];
    if (!ref) {
      throw new InputError(
        `Entity '${entity.metadata.name}' does not have the annotation ${ANNOTATION_LOCATION}`,
      );
    }
    return ref;
  }

  private getLocationEntity(
    urlStr: string,
  ): { entity: LocationEntityV1alpha1; locationKey: string }[] {
    const entity = locationSpecToLocationEntity({
      location: {
        type: 'rhdh-rhoai-bridge',
        target: urlStr,
      },
    });
    const locationKey = this.getEntityLocationRef(entity);
    return [{ entity, locationKey }];
  }*/

  /* private convertModelNameToEntityName(modelName: string): string {
    return modelName.replaceAll(/\:/g, '-');
  }

  private convertModeServerName(modelName: string): string {
    return modelName.replaceAll(/\s/g, '-').toLowerCase();
  }

  private buildResourceEntityFromModelEndpoint(
    models: ModelList,
    modelServerName: string,
  ): ResourceEntity[] {
    const modelResources: ResourceEntity[] = [];
    models.data.forEach(model => {
      const modelResourceEntity: ResourceEntity = {
        kind: 'Resource',
        apiVersion: 'backstage.io/v1alpha1',
        metadata: {
          annotations: {
            [ANNOTATION_LOCATION]: this.getProviderName(),
            [ANNOTATION_ORIGIN_LOCATION]: this.getProviderName(),
          },
          name: `${this.convertModelNameToEntityName(model.id)}`,
          description: `STUB description`,
          links: [
            {
              url: `${this.baseUrl}`,
              title: 'Model API',
            },
          ],
        },
        spec: {
          type: `ai-model`,
          owner: `${this.owner}`,
          dependencyOf: [`component:${modelServerName}`],
          ...(this.system && { system: `${this.system}` }),
        },
      };
      modelResources.push(modelResourceEntity);
    });
    return modelResources;
  }

  private buildComponentEntityFromModelEndpoint(
    modelServerName: string,
  ): ComponentEntity {
    const modelServerComponent: ComponentEntity = {
      kind: 'Component',
      apiVersion: 'backstage.io/v1alpha1',
      metadata: {
        annotations: {
          [ANNOTATION_LOCATION]: this.getProviderName(),
          [ANNOTATION_ORIGIN_LOCATION]: this.getProviderName(),
        },
        name: `${this.convertModeServerName(modelServerName)}`,
        description: `${this.name}`,
        links: [
          {
            url: `${this.baseUrl}`,
            title: 'Model Server API',
          },
        ],
      },
      spec: {
        type: `model-server`,
        lifecycle: 'production',
        owner: `${this.owner}`,
        ...(this.system && { system: `${this.system}` }),
      },
    };

    return modelServerComponent;
  }*/
}
