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
import { JIRA_CONFIG_PATH, THRESHOLDS_CONFIG_PATH } from '../constants';
import {
  DEFAULT_NUMBER_THRESHOLDS,
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  MetricProvider,
  validateThresholds,
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

const { PROJECT_KEY } = ScorecardJiraAnnotations;

export class JiraOpenIssuesProvider implements MetricProvider<'number'> {
  private readonly thresholds: ThresholdConfig;
  private readonly jiraClient: JiraClient;
  private readonly logger: LoggerService;
  private readonly scheduleFn: () => Promise<void>;
  private connection?: MetricProviderConnection;

  private constructor(
    config: Config,
    connectionStrategy: ConnectionStrategy,
    logger: LoggerService,
    taskRunner: SchedulerServiceTaskRunner,
    thresholds?: ThresholdConfig,
  ) {
    this.jiraClient = JiraClientFactory.create(config, connectionStrategy);
    this.thresholds = thresholds ?? DEFAULT_NUMBER_THRESHOLDS;
    this.logger = logger;
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
      scheduler: SchedulerService
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
      options.logger,
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

    // calculate metric for each entity that provider.supportsEntity
    // insert metrics via connection
    await this.connection.insertMetrics([]);

    logger.info(`Committed X metrics for ${this.getProviderId()}`);
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
