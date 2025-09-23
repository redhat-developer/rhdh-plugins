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
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import {
  AuthService,
  LoggerService,
  SchedulerService,
  SchedulerServiceTaskRunner,
} from '@backstage/backend-plugin-api';
import { CatalogService } from '@backstage/plugin-catalog-node';
import {
  DEFAULT_NUMBER_THRESHOLDS,
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { BaseMetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { GithubClient } from '../github/GithubClient';
import { getRepositoryInformationFromEntity } from '../github/utils';
import { GITHUB_PROJECT_ANNOTATION } from '../github/constants';

export class GithubOpenPRsProvider extends BaseMetricProvider<'number'> {
  private readonly githubClient: GithubClient;

  private constructor(
    config: Config,
    auth: AuthService,
    logger: LoggerService,
    catalog: CatalogService,
    taskRunner: SchedulerServiceTaskRunner,
    thresholds?: ThresholdConfig,
  ) {
    super(
      auth,
      logger,
      catalog,
      taskRunner,
      { 'metadata.annotations.github.com/project-slug': CATALOG_FILTER_EXISTS },
      thresholds ?? DEFAULT_NUMBER_THRESHOLDS,
    );
    this.githubClient = new GithubClient(config);
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

  supportsEntity(entity: Entity): boolean {
    return (
      entity.metadata.annotations?.[GITHUB_PROJECT_ANNOTATION] !== undefined
    );
  }

  static fromConfig(
    config: Config,
    options: {
      auth: AuthService;
      logger: LoggerService;
      scheduler: SchedulerService;
      catalog: CatalogService;
    },
  ): GithubOpenPRsProvider {
    const thresholds = this.getThresholdsFromConfig(
      config,
      'scorecard.plugins.github.open_prs.thresholds',
    );
    const schedule = this.getScheduleFromConfig(
      config,
      'scorecard.plugins.github.open_prs.schedule',
    );

    const taskRunner = options.scheduler.createScheduledTaskRunner(schedule);

    return new GithubOpenPRsProvider(
      config,
      options.auth,
      options.logger,
      options.catalog,
      taskRunner,
      thresholds,
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
}
