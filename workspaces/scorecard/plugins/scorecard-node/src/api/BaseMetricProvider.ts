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

import type { Config } from '@backstage/config';
import type { Entity } from '@backstage/catalog-model';
import { stringifyEntityRef } from '@backstage/catalog-model';
import {
  AuthService,
  LoggerService,
  SchedulerServiceTaskRunner,
  SchedulerServiceTaskScheduleDefinition,
  readSchedulerServiceTaskScheduleDefinitionFromConfig,
} from '@backstage/backend-plugin-api';
import { type CatalogService } from '@backstage/plugin-catalog-node';
import { v4 as uuid } from 'uuid';
import {
  Metric,
  MetricType,
  MetricValue,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  MetricProvider,
  MetricProviderConnection,
  MetricProviderInsertion,
} from './MetricProvider';
import { validateThresholds } from '../utils';

/**
 * Abstract base class for metric providers that handles
 * scheduled metric collection.
 *
 * @public
 */
export abstract class BaseMetricProvider<T extends MetricType = MetricType>
  implements MetricProvider<T>
{
  private static readonly CATALOG_BATCH_SIZE = 50;

  private readonly thresholds: ThresholdConfig;
  protected readonly logger: LoggerService;
  private readonly catalog: CatalogService;
  private readonly auth: AuthService;
  private readonly catalogFilter: Record<
    string,
    string | symbol | (string | symbol)[]
  >;
  private readonly scheduleFn: () => Promise<void>;
  private connection?: MetricProviderConnection;

  protected constructor(
    auth: AuthService,
    logger: LoggerService,
    catalog: CatalogService,
    taskRunner: SchedulerServiceTaskRunner,
    catalogFilter: Record<string, string | symbol | (string | symbol)[]>,
    thresholds: ThresholdConfig,
  ) {
    this.thresholds = thresholds;
    this.auth = auth;
    this.logger = logger;
    this.catalog = catalog;
    this.catalogFilter = catalogFilter;
    this.scheduleFn = this.createScheduleFn(taskRunner);
  }

  abstract getProviderDatasourceId(): string;
  abstract getProviderId(): string;
  abstract getMetric(): Metric<T>;
  abstract supportsEntity(entity: Entity): boolean;
  abstract calculateMetric(entity: Entity): Promise<MetricValue<T>>;

  getMetricThresholds(): ThresholdConfig {
    return this.thresholds;
  }

  /**
   * Connects the metric provider and schedules a recurring task to refresh metrics for catalog entities.
   * Called upon initialization.
   *
   * @param connection - The database connection for storing metric results
   */
  async connect(connection: MetricProviderConnection): Promise<void> {
    this.connection = connection;
    await this.scheduleFn();
  }

  /**
   * Reads schedule configuration from config or returns default
   */
  protected static getScheduleFromConfig(
    config: Config,
    configPath: string,
  ): SchedulerServiceTaskScheduleDefinition {
    return config.has(configPath)
      ? readSchedulerServiceTaskScheduleDefinitionFromConfig(
          config.getConfig(configPath),
        )
      : ({
          frequency: { hours: 2 },
          timeout: { minutes: 15 },
          initialDelay: { seconds: 3 },
        } as SchedulerServiceTaskScheduleDefinition);
  }

  /**
   * Reads threshold configuration from config or returns undefined
   */
  protected static getThresholdsFromConfig(
    config: Config,
    configPath: string,
  ): ThresholdConfig | undefined {
    const configuredThresholds = config.getOptional(configPath);
    if (configuredThresholds !== undefined) {
      validateThresholds(configuredThresholds, 'number');
    }
    return configuredThresholds;
  }

  /**
   * Refreshes metrics by querying the catalog and calculating metrics for all supported entities
   */
  private async refresh(logger: LoggerService): Promise<void> {
    if (!this.connection) {
      throw new Error('Not initialized');
    }

    logger.info(`Refreshing metrics for ${this.getProviderId()}`);
    let totalProcessed = 0;
    let cursor: string | undefined = undefined;

    try {
      do {
        const entitiesResponse = await this.catalog.queryEntities(
          {
            filter: this.catalogFilter,
            limit: BaseMetricProvider.CATALOG_BATCH_SIZE,
            ...(cursor ? { cursor } : {}),
          },
          { credentials: await this.auth.getOwnServiceCredentials() },
        );

        cursor = entitiesResponse.pageInfo.nextCursor;

        const batchResults = await Promise.allSettled(
          entitiesResponse.items.map(async entity => {
            try {
              logger.info(`Calculating for ${stringifyEntityRef(entity)}`);
              const value = await this.calculateMetric(entity);
              return {
                catalog_entity_ref: stringifyEntityRef(entity),
                metric_id: this.getProviderId(),
                value,
                timestamp: new Date(),
                error_message: undefined,
              } as MetricProviderInsertion;
            } catch (error) {
              return {
                catalog_entity_ref: stringifyEntityRef(entity),
                metric_id: this.getProviderId(),
                value: undefined,
                timestamp: new Date(),
                error_message:
                  error instanceof Error ? error.message : String(error),
              } as MetricProviderInsertion;
            }
          }),
        ).then(promises =>
          promises.reduce((acc, curr) => {
            if (curr.status === 'fulfilled') {
              return [...acc, curr.value];
            }
            return acc;
          }, [] as MetricProviderInsertion[]),
        );

        await this.connection.insertMetrics(batchResults);
        totalProcessed += entitiesResponse.items.length;
      } while (cursor !== undefined);

      logger.info(
        `Completed metric refresh for ${this.getProviderId()}: processed ${totalProcessed} entities`,
      );
    } catch (error) {
      logger.error(
        `Failed to refresh metrics for ${this.getProviderId()}: ${error}`,
      );
      throw error;
    }
  }

  /**
   * Creates a function to refresh metrics via task
   */
  private createScheduleFn(
    taskRunner: SchedulerServiceTaskRunner,
  ): () => Promise<void> {
    return async () => {
      const taskId = `${this.getProviderId()}:refresh`;
      return taskRunner.run({
        id: taskId,
        fn: async () => {
          const logger = this.logger.child({
            class: this.constructor.name,
            taskId,
            taskInstanceId: uuid(),
          });

          try {
            await this.refresh(logger);
          } catch (error) {
            logger.error(
              `${this.getProviderId()} refresh failed, ${error}`,
              error,
            );
          }
        },
      });
    };
  }
}
