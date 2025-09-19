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
import { getEntitySourceLocation, type Entity } from '@backstage/catalog-model';
import {
  DEFAULT_NUMBER_THRESHOLDS,
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  MetricProvider,
  validateThresholds,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { GithubClient } from '../github/GithubClient';
import { getRepositoryInformationFromEntity } from '../github/utils';
import { GITHUB_PROJECT_ANNOTATION } from '../github/constants';
import {
  LoggerService,
  readSchedulerServiceTaskScheduleDefinitionFromConfig,
  SchedulerService,
  SchedulerServiceTaskRunner,
  SchedulerServiceTaskScheduleDefinition,
} from '@backstage/backend-plugin-api';
import { v4 as uuid } from 'uuid';
import { MetricProviderConnection } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

export class GithubOpenPRsProvider implements MetricProvider<'number'> {
  private readonly thresholds: ThresholdConfig;
  private readonly githubClient: GithubClient;
  private readonly logger: LoggerService;
  private readonly scheduleFn: () => Promise<void>;
  private connection?: MetricProviderConnection;

  private constructor(
    config: Config,
    logger: LoggerService,
    taskRunner: SchedulerServiceTaskRunner,
    thresholds?: ThresholdConfig,
  ) {
    this.githubClient = new GithubClient(config);
    this.thresholds = thresholds ?? DEFAULT_NUMBER_THRESHOLDS;
    this.logger = logger;
    this.scheduleFn = this.schedule(taskRunner);
  }

  getProviderDatasourceId(): string {
    return 'github';
  }

  getProviderId() {
    return 'github.open_prs';
  }

  getMetric(): Metric<'number'> {
    return {
      id: this.getProviderId(),
      title: 'GitHub open PRs',
      description:
        'Current count of open Pull Requests for a given GitHub repository.',
      type: 'number',
      history: true,
    };
  }

  getMetricThresholds(): ThresholdConfig {
    return this.thresholds;
  }

  supportsEntity(entity: Entity): boolean {
    return (
      entity.metadata.annotations?.[GITHUB_PROJECT_ANNOTATION] !== undefined
    );
  }

  static fromConfig(
    config: Config,
    options: { logger: LoggerService; scheduler: SchedulerService },
  ): GithubOpenPRsProvider {
    const configPath = 'scorecard.plugins.github.open_prs.thresholds';
    const configuredThresholds = config.getOptional(configPath);
    if (configuredThresholds !== undefined) {
      validateThresholds(configuredThresholds, 'number');
    }

    const schedule = config.has('scorecard.plugins.github.open_prs.schedule')
      ? readSchedulerServiceTaskScheduleDefinitionFromConfig(
          config.getConfig('scorecard.plugins.github.open_prs.schedule'),
        )
      : ({
          frequency: { hours: 2 },
          timeout: { minutes: 15 },
          initialDelay: { seconds: 3 },
          scope: 'local',
        } as SchedulerServiceTaskScheduleDefinition);

    const taskRunner = options.scheduler.createScheduledTaskRunner(schedule);

    return new GithubOpenPRsProvider(
      config,
      options.logger,
      taskRunner,
      configuredThresholds,
    );
  }

  async calculateMetric(entity: Entity): Promise<number> {
    const repository = getRepositoryInformationFromEntity(entity);
    const { target } = getEntitySourceLocation(entity);

    const result = await this.githubClient.getOpenPullRequestsCount(
      target,
      repository,
    );

    return result;
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
            class: GithubOpenPRsProvider.prototype.constructor.name,
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
