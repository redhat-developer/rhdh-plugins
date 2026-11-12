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
  GITLAB_MERGE_REQUESTS_METRIC_IDS,
  GITLAB_METRIC,
  GITLAB_PROVIDER_IDS,
} from './GitlabConfig';

export class GitlabMergeRequestsProvider implements MetricProvider<'number'> {
  private readonly gitlabClient: GitlabClient;

  private constructor(gitlabClient: GitlabClient) {
    this.gitlabClient = gitlabClient;
  }

  static create(gitlabClient: GitlabClient): GitlabMergeRequestsProvider {
    return new GitlabMergeRequestsProvider(gitlabClient);
  }

  getProviderDatasourceId(): string {
    return GITLAB_METRIC;
  }

  getProviderId(): string {
    return GITLAB_PROVIDER_IDS.MERGE_REQUESTS;
  }

  getMetrics(): Metric<'number'>[] {
    return [
      {
        id: GITLAB_MERGE_REQUESTS_METRIC_IDS.OPEN_MRS,
        title: 'GitLab open merge requests',
        description:
          'Current count of open merge requests for a given GitLab project.',
        type: 'number',
        thresholds: DEFAULT_NUMBER_THRESHOLDS,
        history: true,
      },
      {
        id: GITLAB_MERGE_REQUESTS_METRIC_IDS.OPENED_MRS_7D,
        title: 'GitLab merge requests opened (7d)',
        description:
          'Number of merge requests opened in the last 7 days for a given GitLab project.',
        type: 'number',
        thresholds: DEFAULT_NUMBER_THRESHOLDS,
        history: true,
      },
      {
        id: GITLAB_MERGE_REQUESTS_METRIC_IDS.CLOSED_MRS_7D,
        title: 'GitLab merge requests closed (7d)',
        description:
          'Number of merge requests in closed or merged state that were updated in the last 7 days for a given GitLab project.',
        type: 'number',
        thresholds: DEFAULT_NUMBER_THRESHOLDS,
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

    const [openMRs, openedMRs, closedMRs] = await Promise.all([
      this.gitlabClient.getOpenMergeRequestsCount(target, projectSlug),
      this.gitlabClient.getOpenedMergeRequestsCount(
        target,
        projectSlug,
        sevenDaysAgo,
      ),
      this.gitlabClient.getClosedMergeRequestsCount(
        target,
        projectSlug,
        sevenDaysAgo,
      ),
    ]);

    return new Map([
      [GITLAB_MERGE_REQUESTS_METRIC_IDS.OPEN_MRS, openMRs],
      [GITLAB_MERGE_REQUESTS_METRIC_IDS.OPENED_MRS_7D, openedMRs],
      [GITLAB_MERGE_REQUESTS_METRIC_IDS.CLOSED_MRS_7D, closedMRs],
    ]);
  }
}
