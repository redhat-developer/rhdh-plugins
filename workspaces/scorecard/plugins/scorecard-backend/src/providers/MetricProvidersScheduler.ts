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
import { stringifyEntityRef } from '@backstage/catalog-model';
import {
  AuthService,
  LoggerService,
  SchedulerService,
  SchedulerServiceTaskScheduleDefinition,
  readSchedulerServiceTaskScheduleDefinitionFromConfig,
} from '@backstage/backend-plugin-api';
import { type CatalogService } from '@backstage/plugin-catalog-node';
import { v4 as uuid } from 'uuid';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import {
  DbMetricValue,
  MetricValuesStore,
} from '../database/MetricValuesStore';
import { MetricProvidersRegistry } from './MetricProvidersRegistry';

export class MetricProvidersScheduler {
  private static readonly CATALOG_BATCH_SIZE = 50;

  constructor(
    private readonly auth: AuthService,
    private readonly catalog: CatalogService,
    private readonly config: Config,
    private readonly logger: LoggerService,
    private readonly scheduler: SchedulerService,
    private readonly metricValuesStore: MetricValuesStore,
    private readonly metricProvidersRegistry: MetricProvidersRegistry,
  ) {}

  async schedule() {
    const providers = this.metricProvidersRegistry.listProviders();
    const scheduledProviders: string[] = [];

    await Promise.all(
      providers.map(async provider => {
        try {
          await this.scheduleProvider(provider);
          scheduledProviders.push(provider.getProviderId());
        } catch (e) {
          this.logger.warn(
            `Failed to schedule provider ${provider.getProviderId()}, ${e}`,
          );
        }
      }),
    );

    this.logger.info(
      `Scheduled ${scheduledProviders.length}/${providers.length} metric providers`,
    );
  }

  /**
   * Schedule a metric provider for periodic execution
   */
  private async scheduleProvider(provider: MetricProvider): Promise<void> {
    const providerId = provider.getProviderId();
    const scheduleConfigPath = `scorecard.plugins.${providerId}.schedule`;
    const schedule = this.getScheduleFromConfig(scheduleConfigPath);

    await this.scheduler.scheduleTask({
      id: providerId,
      ...schedule,
      fn: async () => {
        const logger = this.logger.child({
          class: this.constructor.name,
          taskId: `${provider.getProviderId()}:refresh`,
          taskInstanceId: uuid(),
        });

        try {
          await this.refreshProvider(provider, logger);
        } catch (error) {
          logger.error(
            `${provider.getProviderId()} refresh failed, ${error}`,
            error,
          );
        }
      },
    });
  }

  private async refreshProvider(
    provider: MetricProvider,
    logger: LoggerService,
  ): Promise<void> {
    const providerId = provider.getProviderId();
    logger.info(`Refreshing metrics for ${providerId}`);
    let totalProcessed = 0;
    let cursor: string | undefined = undefined;

    try {
      do {
        const entitiesResponse = await this.catalog.queryEntities(
          {
            filter: provider.getCatalogFilter(),
            limit: MetricProvidersScheduler.CATALOG_BATCH_SIZE,
            ...(cursor ? { cursor } : {}),
          },
          { credentials: await this.auth.getOwnServiceCredentials() },
        );

        cursor = entitiesResponse.pageInfo.nextCursor;

        const batchResults = await Promise.allSettled(
          entitiesResponse.items.map(async entity => {
            try {
              const value = await provider.calculateMetric(entity);
              return {
                catalog_entity_ref: stringifyEntityRef(entity),
                metric_id: providerId,
                value,
                timestamp: new Date(),
                error_message: undefined,
              };
            } catch (error) {
              return {
                catalog_entity_ref: stringifyEntityRef(entity),
                metric_id: providerId,
                value: undefined,
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

        await this.metricValuesStore.createMetricValues(batchResults);
        totalProcessed += entitiesResponse.items.length;
      } while (cursor !== undefined);

      logger.info(
        `Completed metric refresh for ${provider.getProviderId()}: processed ${totalProcessed} entities`,
      );
    } catch (error) {
      logger.error(
        `Failed to refresh metrics for ${provider.getProviderId()}: ${error}`,
      );
      throw error;
    }
  }

  private getScheduleFromConfig(
    schedulePath: string,
  ): SchedulerServiceTaskScheduleDefinition {
    return this.config.has(schedulePath)
      ? readSchedulerServiceTaskScheduleDefinitionFromConfig(
          this.config.getConfig(schedulePath),
        )
      : ({
          frequency: { hours: 2 },
          timeout: { minutes: 15 },
          initialDelay: { seconds: 3 },
        } as SchedulerServiceTaskScheduleDefinition);
  }
}
