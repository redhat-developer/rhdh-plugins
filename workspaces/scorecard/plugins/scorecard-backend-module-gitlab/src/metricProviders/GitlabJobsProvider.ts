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

import type { LoggerService } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import { getEntitySourceLocation, type Entity } from '@backstage/catalog-model';
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import {
  DEFAULT_NUMBER_THRESHOLDS,
  Metric,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { GitlabClient } from '../gitlab/GitlabClient';
import { getProjectSlugFromEntity } from '../utils/getProjectSlugFromEntity';
import { GITLAB_PROJECT_ANNOTATION } from '../gitlab/constants';
import {
  GITLAB_JOBS_METRIC_IDS,
  GITLAB_PERCENTAGE_THRESHOLDS,
  GITLAB_METRIC,
} from './GitlabConfig';
import { calculateRatio } from '../utils/calculateRatio';

export class GitlabJobsProvider implements MetricProvider<'number'> {
  private readonly gitlabClient: GitlabClient;

  private constructor(gitlabClient: GitlabClient) {
    this.gitlabClient = gitlabClient;
  }

  static fromConfig(
    config: Config,
    options: { logger: LoggerService },
  ): GitlabJobsProvider {
    return new GitlabJobsProvider(new GitlabClient(config, options.logger));
  }

  getProviderDatasourceId(): string {
    return GITLAB_METRIC;
  }

  getProviderId(): string {
    return GITLAB_JOBS_METRIC_IDS.STARTED_7D;
  }

  getMetrics(): Metric<'number'>[] {
    return [
      {
        id: GITLAB_JOBS_METRIC_IDS.STARTED_7D,
        title: 'GitLab jobs started (7d)',
        description:
          'Number of jobs started in the last 7 days for a given GitLab project.',
        type: 'number',
        thresholds: DEFAULT_NUMBER_THRESHOLDS,
        history: true,
      },
      {
        id: GITLAB_JOBS_METRIC_IDS.SUCCESSFUL_7D,
        title: 'GitLab successful jobs (7d)',
        description:
          'Number of successfully finished jobs in the last 7 days for a given GitLab project.',
        type: 'number',
        thresholds: DEFAULT_NUMBER_THRESHOLDS,
        history: true,
      },
      {
        id: GITLAB_JOBS_METRIC_IDS.FAILED_7D,
        title: 'GitLab failed jobs (7d)',
        description:
          'Number of failed jobs in the last 7 days for a given GitLab project.',
        type: 'number',
        thresholds: DEFAULT_NUMBER_THRESHOLDS,
        history: true,
      },
      {
        id: GITLAB_JOBS_METRIC_IDS.SUCCESS_RATIO_7D,
        title: 'GitLab job success ratio (7d)',
        description:
          'Ratio of successful vs successful+failed jobs in the last 7 days (percentage). Ignores pending, running, and canceled jobs.',
        type: 'number',
        thresholds: GITLAB_PERCENTAGE_THRESHOLDS,
        history: true,
      },
      {
        id: GITLAB_JOBS_METRIC_IDS.SUCCESS_RATIO_24H,
        title: 'GitLab job success ratio (24h)',
        description:
          'Ratio of successful vs successful+failed jobs in the last 24 hours (percentage). Ignores pending, running, and canceled jobs.',
        type: 'number',
        thresholds: GITLAB_PERCENTAGE_THRESHOLDS,
        history: true,
      },
    ];
  }

  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return {
      [`metadata.annotations.${GITLAB_PROJECT_ANNOTATION}`]:
        CATALOG_FILTER_EXISTS,
    };
  }

  async calculateMetrics(entity: Entity): Promise<Map<string, number>> {
    const projectSlug = getProjectSlugFromEntity(entity);
    const { target } = getEntitySourceLocation(entity);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [started7d, successful7d, failed7d, successful24h, failed24h] =
      await Promise.all([
        this.gitlabClient.getJobsCount(target, projectSlug, sevenDaysAgo),
        this.gitlabClient.getJobsCount(target, projectSlug, sevenDaysAgo, [
          'success',
        ]),
        this.gitlabClient.getJobsCount(target, projectSlug, sevenDaysAgo, [
          'failed',
        ]),
        this.gitlabClient.getJobsCount(target, projectSlug, oneDayAgo, [
          'success',
        ]),
        this.gitlabClient.getJobsCount(target, projectSlug, oneDayAgo, [
          'failed',
        ]),
      ]);

    return new Map([
      [GITLAB_JOBS_METRIC_IDS.STARTED_7D, started7d],
      [GITLAB_JOBS_METRIC_IDS.SUCCESSFUL_7D, successful7d],
      [GITLAB_JOBS_METRIC_IDS.FAILED_7D, failed7d],
      [
        GITLAB_JOBS_METRIC_IDS.SUCCESS_RATIO_7D,
        calculateRatio(successful7d, failed7d),
      ],
      [
        GITLAB_JOBS_METRIC_IDS.SUCCESS_RATIO_24H,
        calculateRatio(successful24h, failed24h),
      ],
    ]);
  }
}
