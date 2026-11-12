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
  GITLAB_PIPELINES_METRIC_IDS,
  GITLAB_PERCENTAGE_THRESHOLDS,
  GITLAB_SUCCESS_COUNT_THRESHOLDS,
  GITLAB_METRIC,
  GITLAB_PROVIDER_IDS,
} from './GitlabConfig';
import { calculateRatio } from '../utils/calculateRatio';
import { oneDayAgo, sevenDaysAgo } from '../utils/relativeDates';

export class GitlabPipelinesProvider implements MetricProvider<'number'> {
  private readonly gitlabClient: GitlabClient;

  private constructor(gitlabClient: GitlabClient) {
    this.gitlabClient = gitlabClient;
  }

  static create(gitlabClient: GitlabClient): GitlabPipelinesProvider {
    return new GitlabPipelinesProvider(gitlabClient);
  }

  getProviderDatasourceId(): string {
    return GITLAB_METRIC;
  }

  getProviderId(): string {
    return GITLAB_PROVIDER_IDS.PIPELINES;
  }

  getMetrics(): Metric<'number'>[] {
    return [
      {
        id: GITLAB_PIPELINES_METRIC_IDS.STARTED_7D,
        title: 'GitLab pipelines started (7d)',
        description:
          'Number of pipelines started in the last 7 days for a given GitLab project.',
        type: 'number',
        thresholds: DEFAULT_NUMBER_THRESHOLDS,
        history: true,
      },
      {
        id: GITLAB_PIPELINES_METRIC_IDS.SUCCESSFUL_7D,
        title: 'GitLab successful pipelines (7d)',
        description:
          'Number of successfully finished pipelines in the last 7 days for a given GitLab project.',
        type: 'number',
        thresholds: GITLAB_SUCCESS_COUNT_THRESHOLDS,
        history: true,
      },
      {
        id: GITLAB_PIPELINES_METRIC_IDS.FAILED_7D,
        title: 'GitLab failed pipelines (7d)',
        description:
          'Number of failed pipelines in the last 7 days for a given GitLab project.',
        type: 'number',
        thresholds: DEFAULT_NUMBER_THRESHOLDS,
        history: true,
      },
      {
        id: GITLAB_PIPELINES_METRIC_IDS.SUCCESS_RATIO_7D,
        title: 'GitLab pipeline success ratio (7d)',
        description:
          'Ratio of successful vs successful+failed pipelines in the last 7 days (percentage). Ignores pending, running, and canceled pipelines.',
        type: 'number',
        thresholds: GITLAB_PERCENTAGE_THRESHOLDS,
        unit: '%',
        history: true,
      },
      {
        id: GITLAB_PIPELINES_METRIC_IDS.SUCCESS_RATIO_24H,
        title: 'GitLab pipeline success ratio (24h)',
        description:
          'Ratio of successful vs successful+failed pipelines in the last 24 hours (percentage). Ignores pending, running, and canceled pipelines.',
        type: 'number',
        thresholds: GITLAB_PERCENTAGE_THRESHOLDS,
        unit: '%',
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
    const since7d = sevenDaysAgo();
    const since1d = oneDayAgo();

    const [started7d, successful7d, failed7d, successful24h, failed24h] =
      await Promise.all([
        this.gitlabClient.getPipelinesCount(target, projectSlug, since7d),
        this.gitlabClient.getPipelinesCount(
          target,
          projectSlug,
          since7d,
          'success',
        ),
        this.gitlabClient.getPipelinesCount(
          target,
          projectSlug,
          since7d,
          'failed',
        ),
        this.gitlabClient.getPipelinesCount(
          target,
          projectSlug,
          since1d,
          'success',
        ),
        this.gitlabClient.getPipelinesCount(
          target,
          projectSlug,
          since1d,
          'failed',
        ),
      ]);

    return new Map([
      [GITLAB_PIPELINES_METRIC_IDS.STARTED_7D, started7d],
      [GITLAB_PIPELINES_METRIC_IDS.SUCCESSFUL_7D, successful7d],
      [GITLAB_PIPELINES_METRIC_IDS.FAILED_7D, failed7d],
      [
        GITLAB_PIPELINES_METRIC_IDS.SUCCESS_RATIO_7D,
        calculateRatio(successful7d, failed7d),
      ],
      [
        GITLAB_PIPELINES_METRIC_IDS.SUCCESS_RATIO_24H,
        calculateRatio(successful24h, failed24h),
      ],
    ]);
  }
}
