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
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import { JIRA_CONFIG_PATH, THRESHOLDS_CONFIG_PATH } from '../constants';
import {
  DEFAULT_NUMBER_THRESHOLDS,
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  MetricProvider,
  validateThresholds,
  MetricProviderConnection,
  MetricProviderInsertion,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { JiraClient } from '../clients/base';
import { JiraClientFactory } from '../clients/JiraClientFactory';
import { ScorecardJiraAnnotations } from '../annotations';
import {
  AuthService,
  DiscoveryService,
  LoggerService,
  readSchedulerServiceTaskScheduleDefinitionFromConfig,
  SchedulerService,
  SchedulerServiceTaskRunner,
  SchedulerServiceTaskScheduleDefinition,
} from '@backstage/backend-plugin-api';
import {
  ConnectionStrategy,
  DirectConnectionStrategy,
  ProxyConnectionStrategy,
} from '../strategies/ConnectionStrategy';
import { Product } from '../clients/types';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { v4 as uuid } from 'uuid';

const { PROJECT_KEY } = ScorecardJiraAnnotations;

export class JiraOpenIssuesProvider implements MetricProvider<'number'> {
  private readonly thresholds: ThresholdConfig;
  private readonly jiraClient: JiraClient;
  private readonly logger: LoggerService;
  private readonly catalog: CatalogService;
  private readonly auth: AuthService;
  private readonly scheduleFn: () => Promise<void>;
  private connection?: MetricProviderConnection;

  private constructor(
    config: Config,
    connectionStrategy: ConnectionStrategy,
    auth: AuthService,
    logger: LoggerService,
    catalog: CatalogService,
    taskRunner: SchedulerServiceTaskRunner,
    thresholds?: ThresholdConfig,
  ) {
    this.jiraClient = JiraClientFactory.create(config, connectionStrategy);
    this.thresholds = thresholds ?? DEFAULT_NUMBER_THRESHOLDS;
    this.auth = auth;
    this.logger = logger;
    this.catalog = catalog;
    this.scheduleFn = this.schedule(taskRunner);
  }

  getProviderDatasourceId(): string {
    return 'jira';
  }

  getProviderId() {
    return 'jira.open_issues';
  }

  getMetric(): Metric<'number'> {
    return {
      id: this.getProviderId(),
      title: 'Jira open blocking tickets',
      description:
        'Highlights the number of issues that are currently open in Jira.',
      type: 'number',
      history: true,
    };
  }

  getMetricThresholds(): ThresholdConfig {
    return this.thresholds;
  }

  supportsEntity(entity: Entity): boolean {
    return entity.metadata.annotations?.[PROJECT_KEY] !== undefined;
  }

  static fromConfig(
    config: Config,
    options: {
      auth: AuthService;
      discovery: DiscoveryService;
      logger: LoggerService;
      scheduler: SchedulerService;
      catalog: CatalogService;
    },
  ): JiraOpenIssuesProvider {
    const configuredThresholds = config.getOptional(THRESHOLDS_CONFIG_PATH);
    if (configuredThresholds !== undefined) {
      validateThresholds(configuredThresholds, 'number');
    }

    let connectionStrategy: ConnectionStrategy;

    const jiraConfig = config.getConfig(JIRA_CONFIG_PATH);
    const proxyPath = jiraConfig.getOptionalString('proxyPath');

    if (proxyPath) {
      connectionStrategy = new ProxyConnectionStrategy(
        proxyPath,
        options.auth,
        options.discovery,
      );
    } else {
      connectionStrategy = new DirectConnectionStrategy(
        jiraConfig.getString('baseUrl'),
        jiraConfig.getString('token'),
        jiraConfig.getString('product') as Product,
      );
    }

    const schedule = config.has('scorecard.plugins.jira.open_issues.schedule')
    ? readSchedulerServiceTaskScheduleDefinitionFromConfig(
        config.getConfig('scorecard.plugins.jira.open_issues.schedule'),
      )
    : ({
        frequency: { hours: 2 },
        timeout: { minutes: 15 },
        initialDelay: { seconds: 3 },
        scope: 'local',
      } as SchedulerServiceTaskScheduleDefinition);

    return new JiraOpenIssuesProvider(
      config,
      connectionStrategy,
      options.auth,
      options.logger,
      options.catalog,
      taskRunner,
      configuredThresholds,
    );
  }

  async calculateMetric(entity: Entity): Promise<number> {
    return this.jiraClient.getCountOpenIssues(entity);
  }

  public async connect(connection: MetricProviderConnection): Promise<void> {
    this.connection = connection;
    await this.scheduleFn();
  }

  async refresh(logger: LoggerService) {
    if (!this.connection) {
      throw new Error('Not initialized');
    }

    logger.info(`Refreshing metrics for ${this.getProviderId()}`);
    const catalogBatchSize = 100;
    let totalProcessed = 0;
    let cursor: string | undefined = undefined;
    try {
      do {
        const entitiesResponse = await this.catalog.queryEntities(
          {
            filter: {
              'metadata.annotations.jira/project-key': CATALOG_FILTER_EXISTS,
            },
            limit: catalogBatchSize,
            ...(cursor ? { cursor } : {}),
          },
          { credentials: await this.auth.getOwnServiceCredentials() },
        );
        cursor = entitiesResponse.pageInfo.nextCursor;
        totalProcessed += entitiesResponse.items.length;
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
                error_message: null,
              } as MetricProviderInsertion;
            } catch (error) {
              return {
                catalog_entity_ref: stringifyEntityRef(entity),
                metric_id: this.getProviderId(),
                value: null,
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
        cursor = entitiesResponse.pageInfo.nextCursor;
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
   * Periodically schedules a task to run calculation of metrics
   * @param taskRunner - The task runner to use for scheduling tasks.
   */
  private schedule(
    taskRunner: SchedulerServiceTaskRunner,
  ): () => Promise<void> {
    return async () => {
      const taskId = `${this.getProviderId()}:refresh`;
      return taskRunner.run({
        id: taskId,
        fn: async () => {
          const logger = this.logger.child({
            class: JiraOpenIssuesProvider.prototype.constructor.name,
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
