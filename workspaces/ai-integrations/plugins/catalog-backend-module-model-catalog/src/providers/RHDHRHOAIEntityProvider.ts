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
  DiscoveryService,
  LoggerService,
  RootConfigService,
  SchedulerServiceTaskRunner,
  UrlReaderService,
} from '@backstage/backend-plugin-api';
import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
  LocationEntity,
} from '@backstage/catalog-model';
import {
  EntityProvider,
  EntityProviderConnection,
  CatalogProcessorParser,
  CatalogProcessorEntityResult,
} from '@backstage/plugin-catalog-node';
import {
  CatalogApi,
  CatalogClient,
  CatalogRequestOptions,
} from '@backstage/catalog-client';
import { isError } from '@backstage/errors';
import { parseEntityYaml } from '@backstage/plugin-catalog-backend';
import { ModelCatalogConfig } from './types';
import { readModelCatalogApiEntityConfigs } from './config';
/**
 * Provides entities from the model catalog service, allowing models and model servers to be imported into RHDH
 */
export class RHDHRHOAIEntityProvider implements EntityProvider {
  private readonly catalogClient: CatalogApi;
  private readonly logger: LoggerService;
  private readonly scheduleFn: () => Promise<void>;
  private connection?: EntityProviderConnection;
  private readonly reader: UrlReaderService;
  private readonly token: string;
  private readonly modelCatalogConfigs: ModelCatalogConfig[];

  /** [1]: Set configuration values passed into the entity provider. Fields are defined in types.ts */
  constructor(
    discovery: DiscoveryService,
    config: RootConfigService,
    logger: LoggerService,
    taskRunner: SchedulerServiceTaskRunner,
    reader: UrlReaderService,
  ) {
    this.reader = reader;
    this.catalogClient = new CatalogClient({ discoveryApi: discovery });
    this.logger = logger.child({
      target: this.getProviderName(),
    });
    this.scheduleFn = this.createScheduleFn(taskRunner);
    const authConfigs =
      config.getOptionalConfigArray('backend.auth.externalAccess') ?? [];
    this.token = '';
    for (const authConfig of authConfigs) {
      const type = authConfig.getString('type');
      const subject = authConfig.getString('options.subject');
      // TODO make this name something RHDH bridge specific
      if (type === 'static' && subject === 'admin-curl-access') {
        this.token = authConfig.getString('options.token');
        break;
      }
    }
    this.modelCatalogConfigs = readModelCatalogApiEntityConfigs(config);
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
                `Error while syncing resources from RHDH RHOAI bridge}`,
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
    return `RHDHRHOAIEntityProvider`;
  }

  /** [3]: Connect Backstage catalog engine to ModelCatalogEntityProvider */
  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.scheduleFn();
  }

  // the defaultEntityDataParser from backstage's catalog-backend module is not exported (though the parseEntityYaml from the same file is)
  // so we are replicating the small function they have there
  defaultEntityDataParser: CatalogProcessorParser =
    async function* defaultEntityDataParser({ data, location }) {
      for (const e of parseEntityYaml(data, location)) {
        yield e;
      }
    };

  /** [4]: Define the function that the entity provider will execute on a set schedule */
  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error('Not initialized');
    }
    this.logger.info(`Checking RHDH/RHOAI Locations`);

    const filter: Record<string, string> = {
      kind: 'location',
    };
    const options: CatalogRequestOptions = {
      token: this.token,
    };

    const { items } = await this.catalogClient.getEntities({ filter }, options);
    if (items.length === 0) {
      return;
    }
    for (const item of items) {
      const loc = item as LocationEntity;
      let startUpLocation = false;
      if (loc.spec.type === 'rhdh-rhoai-bridge') {
        for (const config of this.modelCatalogConfigs) {
          if (config.baseUrl === loc.spec.target) {
            startUpLocation = true;
            break;
          }
        }
        if (startUpLocation) {
          this.logger.info(
            `RHDHRHOAIEntityProvider skipping ${loc.spec.target} because if is handled by ModelCatalogEntityProvider`,
          );
          continue;
        }
        try {
          const locationURL = loc.spec.target as string;
          const data = await this.reader.readUrl(locationURL);
          const response = [
            { url: loc.spec.target, data: await data.buffer() },
          ];
          for (const resp of response) {
            if (resp.url !== undefined) {
              for await (const parseResult of this.defaultEntityDataParser({
                data: resp.data,
                location: { type: loc.spec.type, target: resp.url },
              })) {
                const resultEntity =
                  parseResult as CatalogProcessorEntityResult;
                const locType = loc.spec.type;
                const locTarget = loc.spec.target;
                const locKey = `${locType}:${locTarget}`;
                if (resultEntity.entity.metadata.annotations === undefined) {
                  resultEntity.entity.metadata.annotations = {
                    [ANNOTATION_LOCATION]: locKey,
                    [ANNOTATION_ORIGIN_LOCATION]: locKey,
                  };
                } else {
                  resultEntity.entity.metadata.annotations[
                    ANNOTATION_LOCATION
                  ] = locKey;
                  resultEntity.entity.metadata.annotations[
                    ANNOTATION_ORIGIN_LOCATION
                  ] = locKey;
                }
                const deferredEntity = {
                  entity: resultEntity.entity,
                  locationKey: locKey,
                };
                await this.connection.applyMutation({
                  type: 'delta',
                  added: [deferredEntity],
                  removed: [],
                });
              }
            }
          }
        } catch (error) {
          const deferredEntity = { entity: item };
          await this.connection.applyMutation({
            type: 'delta',
            added: [],
            removed: [deferredEntity],
          });
        }
      }
    }
  }
}
