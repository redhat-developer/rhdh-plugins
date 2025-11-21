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

import { DatabaseMetricValues } from '../../database/DatabaseMetricValues';
import {
  AuthService,
  readSchedulerServiceTaskScheduleDefinitionFromConfig,
  SchedulerService,
  SchedulerServiceTaskScheduleDefinition,
  LoggerService,
} from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { mergeEntityAndProviderThresholds } from '../../utils/mergeEntityAndProviderThresholds';
import { v4 as uuid } from 'uuid';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { DbMetricValue } from '../../database/types';
import { SchedulerOptions, SchedulerTask } from '../types';
import { ThresholdEvaluator } from '../../threshold/ThresholdEvaluator';

type Options = Pick<
  SchedulerOptions,
  | 'scheduler'
  | 'logger'
  | 'database'
  | 'config'
  | 'catalog'
  | 'auth'
  | 'thresholdEvaluator'
>;

export class PullMetricsByProviderTask implements SchedulerTask {
  private readonly config: Config;
  private readonly auth: AuthService;
  private readonly providerId: string;
  private readonly logger: LoggerService;
  private readonly catalog: CatalogService;
  private readonly provider: MetricProvider;
  private readonly scheduler: SchedulerService;
  private readonly database: DatabaseMetricValues;
  private readonly thresholdEvaluator: ThresholdEvaluator;

  private static readonly CATALOG_BATCH_SIZE = 50;

  private static readonly DEFAULT_SCHEDULE: SchedulerServiceTaskScheduleDefinition =
    {
      frequency: { hours: 1 },
      timeout: { minutes: 15 },
      initialDelay: { seconds: 3 },
    };

  constructor(options: Options, provider: MetricProvider) {
    this.config = options.config;
    this.auth = options.auth;
    this.providerId = provider.getProviderId();
    this.logger = options.logger;
    this.catalog = options.catalog;
    this.provider = provider;
    this.scheduler = options.scheduler;
    this.database = options.database;
    this.thresholdEvaluator = options.thresholdEvaluator;
  }

  async start(): Promise<void> {
    const scheduleConfigPath = `scorecard.plugins.${this.providerId}.schedule`;
    const schedule = this.getScheduleFromConfig(scheduleConfigPath);

    const taskRunner = this.scheduler.createScheduledTaskRunner(schedule);

    await taskRunner.run({
      id: this.providerId,
      fn: async () => {
        const logger = this.logger.child({
          class: this.constructor.name,
          taskId: this.providerId,
          taskInstanceId: uuid(),
        });

        try {
          await this.pullProviderMetrics(this.provider, logger);
        } catch (error) {
          logger.error(
            `${this.providerId} pulling metrics failed, ${error}`,
            error,
          );
        }
      },
    });
  }

  private getScheduleFromConfig(
    schedulePath: string,
  ): SchedulerServiceTaskScheduleDefinition {
    return this.config.has(schedulePath)
      ? readSchedulerServiceTaskScheduleDefinitionFromConfig(
          this.config.getConfig(schedulePath),
        )
      : PullMetricsByProviderTask.DEFAULT_SCHEDULE;
  }

  private async pullProviderMetrics(
    provider: MetricProvider,
    logger: LoggerService,
  ): Promise<void> {
    logger.info(`Pulling metrics for ${this.providerId}`);

    let totalProcessed = 0;
    let cursor: string | undefined = undefined;

    const metricType = provider.getMetricType();

    try {
      do {
        const entitiesResponse = await this.catalog.queryEntities(
          {
            filter: provider.getCatalogFilter(),
            limit: PullMetricsByProviderTask.CATALOG_BATCH_SIZE,
            ...(cursor ? { cursor } : {}),
          },
          { credentials: await this.auth.getOwnServiceCredentials() },
        );

        cursor = entitiesResponse.pageInfo.nextCursor;

        const batchResults = await Promise.allSettled(
          entitiesResponse.items.map(async entity => {
            try {
              const thresholds = mergeEntityAndProviderThresholds(
                entity,
                provider,
              );
              const value = await provider.calculateMetric(entity);
              const status = this.thresholdEvaluator.getFirstMatchingThreshold(
                value,
                metricType,
                thresholds,
              );

              return {
                catalog_entity_ref: stringifyEntityRef(entity),
                metric_id: this.providerId,
                value,
                timestamp: new Date(),
                status,
              };
            } catch (error) {
              return {
                catalog_entity_ref: stringifyEntityRef(entity),
                metric_id: this.providerId,
                timestamp: new Date(),
                error_message:
                  error instanceof Error ? error.message : String(error),
              };
            }
          }),
        ).then(promises =>
          promises.reduce((acc, curr) => {
            if (curr.status === 'fulfilled') {
              return [...acc, curr.value];
            }
            return acc;
          }, [] as Omit<DbMetricValue, 'id'>[]),
        );

        await this.database.createMetricValues(batchResults);
        totalProcessed += entitiesResponse.items.length;
      } while (cursor !== undefined);

      logger.info(
        `Completed metric pull for ${this.providerId}: processed ${totalProcessed} entities`,
      );
    } catch (error) {
      logger.error(`Failed to pull metrics for ${this.providerId}: ${error}`);

      throw error;
    }
  }
}
