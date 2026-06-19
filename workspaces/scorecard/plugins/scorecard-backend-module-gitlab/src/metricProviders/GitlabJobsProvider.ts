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
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import {
  DEFAULT_NUMBER_THRESHOLDS,
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { GitlabClient } from '../gitlab/GitlabClient';
import { getProjectSlugFromEntity } from '../gitlab/utils';
import { GITLAB_PROJECT_ANNOTATION } from '../gitlab/constants';
import { calculateRatio } from './GitlabPipelinesProvider';

const METRIC_IDS = {
  STARTED_7D: 'gitlab.started_jobs_7d',
  SUCCESSFUL_7D: 'gitlab.successful_jobs_7d',
  FAILED_7D: 'gitlab.failed_jobs_7d',
  SUCCESS_RATIO_7D: 'gitlab.job_success_ratio_7d',
  SUCCESS_RATIO_24H: 'gitlab.job_success_ratio_24h',
} as const;

export class GitlabJobsProvider implements MetricProvider<'number'> {
  private readonly gitlabClient: GitlabClient;

  private constructor(config: Config) {
    this.gitlabClient = new GitlabClient(config);
  }

  static fromConfig(config: Config): GitlabJobsProvider {
    return new GitlabJobsProvider(config);
  }

  getProviderDatasourceId(): string {
    return 'gitlab';
  }

  getProviderId(): string {
    return METRIC_IDS.STARTED_7D;
  }

  getMetricType(): 'number' {
    return 'number';
  }

  getMetric(): Metric<'number'> {
    return {
      id: METRIC_IDS.STARTED_7D,
      title: 'GitLab jobs started (7d)',
      description:
        'Number of jobs started in the last 7 days for a given GitLab project.',
      type: 'number',
      history: true,
    };
  }

  getMetricThresholds(): ThresholdConfig {
    return DEFAULT_NUMBER_THRESHOLDS;
  }

  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return {
      [`metadata.annotations.${GITLAB_PROJECT_ANNOTATION}`]:
        CATALOG_FILTER_EXISTS,
    };
  }

  getMetricIds(): string[] {
    return Object.values(METRIC_IDS);
  }

  getMetrics(): Metric<'number'>[] {
    return [
      {
        id: METRIC_IDS.STARTED_7D,
        title: 'GitLab jobs started (7d)',
        description:
          'Number of jobs started in the last 7 days for a given GitLab project.',
        type: 'number',
        history: true,
      },
      {
        id: METRIC_IDS.SUCCESSFUL_7D,
        title: 'GitLab successful jobs (7d)',
        description:
          'Number of successfully finished jobs in the last 7 days for a given GitLab project.',
        type: 'number',
        history: true,
      },
      {
        id: METRIC_IDS.FAILED_7D,
        title: 'GitLab failed jobs (7d)',
        description:
          'Number of failed jobs in the last 7 days for a given GitLab project.',
        type: 'number',
        history: true,
      },
      {
        id: METRIC_IDS.SUCCESS_RATIO_7D,
        title: 'GitLab job success ratio (7d)',
        description:
          'Ratio of successful vs successful+failed jobs in the last 7 days (percentage). Ignores pending, running, and canceled jobs.',
        type: 'number',
        history: true,
      },
      {
        id: METRIC_IDS.SUCCESS_RATIO_24H,
        title: 'GitLab job success ratio (24h)',
        description:
          'Ratio of successful vs successful+failed jobs in the last 24 hours (percentage). Ignores pending, running, and canceled jobs.',
        type: 'number',
        history: true,
      },
    ];
  }

  async calculateMetric(entity: Entity): Promise<number> {
    const projectSlug = getProjectSlugFromEntity(entity);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return this.gitlabClient.getJobsCount(projectSlug, sevenDaysAgo);
  }

  async calculateMetrics(entity: Entity): Promise<Map<string, number>> {
    const projectSlug = getProjectSlugFromEntity(entity);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [started7d, successful7d, failed7d, successful24h, failed24h] =
      await Promise.all([
        this.gitlabClient.getJobsCount(projectSlug, sevenDaysAgo),
        this.gitlabClient.getJobsCount(projectSlug, sevenDaysAgo, ['success']),
        this.gitlabClient.getJobsCount(projectSlug, sevenDaysAgo, ['failed']),
        this.gitlabClient.getJobsCount(projectSlug, oneDayAgo, ['success']),
        this.gitlabClient.getJobsCount(projectSlug, oneDayAgo, ['failed']),
      ]);

    return new Map([
      [METRIC_IDS.STARTED_7D, started7d],
      [METRIC_IDS.SUCCESSFUL_7D, successful7d],
      [METRIC_IDS.FAILED_7D, failed7d],
      [METRIC_IDS.SUCCESS_RATIO_7D, calculateRatio(successful7d, failed7d)],
      [METRIC_IDS.SUCCESS_RATIO_24H, calculateRatio(successful24h, failed24h)],
    ]);
  }
}
