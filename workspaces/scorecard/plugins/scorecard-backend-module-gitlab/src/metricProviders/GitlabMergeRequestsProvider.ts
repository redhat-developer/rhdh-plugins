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

const METRIC_IDS = {
  OPEN_MRS: 'gitlab.open_merge_requests',
  OPENED_MRS_7D: 'gitlab.opened_merge_requests_7d',
  CLOSED_MRS_7D: 'gitlab.closed_merge_requests_7d',
} as const;

export class GitlabMergeRequestsProvider implements MetricProvider<'number'> {
  private readonly gitlabClient: GitlabClient;

  private constructor(config: Config) {
    this.gitlabClient = new GitlabClient(config);
  }

  static fromConfig(config: Config): GitlabMergeRequestsProvider {
    return new GitlabMergeRequestsProvider(config);
  }

  getProviderDatasourceId(): string {
    return 'gitlab';
  }

  getProviderId(): string {
    return METRIC_IDS.OPEN_MRS;
  }

  getMetricType(): 'number' {
    return 'number';
  }

  getMetric(): Metric<'number'> {
    return {
      id: METRIC_IDS.OPEN_MRS,
      title: 'GitLab open merge requests',
      description:
        'Current count of open merge requests for a given GitLab project.',
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
        id: METRIC_IDS.OPEN_MRS,
        title: 'GitLab open merge requests',
        description:
          'Current count of open merge requests for a given GitLab project.',
        type: 'number',
        history: true,
      },
      {
        id: METRIC_IDS.OPENED_MRS_7D,
        title: 'GitLab merge requests opened (7d)',
        description:
          'Number of merge requests opened in the last 7 days for a given GitLab project.',
        type: 'number',
        history: true,
      },
      {
        id: METRIC_IDS.CLOSED_MRS_7D,
        title: 'GitLab merge requests closed (7d)',
        description:
          'Number of merge requests closed or merged in the last 7 days for a given GitLab project.',
        type: 'number',
        history: true,
      },
    ];
  }

  async calculateMetric(entity: Entity): Promise<number> {
    const projectSlug = getProjectSlugFromEntity(entity);
    return this.gitlabClient.getOpenMergeRequestsCount(projectSlug);
  }

  async calculateMetrics(entity: Entity): Promise<Map<string, number>> {
    const projectSlug = getProjectSlugFromEntity(entity);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [openMRs, openedMRs, closedMRs] = await Promise.all([
      this.gitlabClient.getOpenMergeRequestsCount(projectSlug),
      this.gitlabClient.getOpenedMergeRequestsCount(projectSlug, sevenDaysAgo),
      this.gitlabClient.getClosedMergeRequestsCount(projectSlug, sevenDaysAgo),
    ]);

    return new Map([
      [METRIC_IDS.OPEN_MRS, openMRs],
      [METRIC_IDS.OPENED_MRS_7D, openedMRs],
      [METRIC_IDS.CLOSED_MRS_7D, closedMRs],
    ]);
  }
}
