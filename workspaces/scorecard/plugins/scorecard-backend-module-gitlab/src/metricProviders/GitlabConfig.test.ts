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

import {
  GITLAB_ISSUES_METRIC_IDS,
  GITLAB_JOBS_METRIC_IDS,
  GITLAB_MERGE_REQUESTS_METRIC_IDS,
  GITLAB_METRIC,
  GITLAB_PERCENTAGE_THRESHOLDS,
  GITLAB_PIPELINES_METRIC_IDS,
} from './GitlabConfig';

describe('GitlabConfig', () => {
  it('should use gitlab as the datasource id', () => {
    expect(GITLAB_METRIC).toBe('gitlab');
  });

  it('should lock issues metric ids', () => {
    expect(GITLAB_ISSUES_METRIC_IDS).toEqual({
      OPEN_ISSUES: 'gitlab.openIssues',
      OPENED_ISSUES_7D: 'gitlab.openedIssues7d',
      CLOSED_ISSUES_7D: 'gitlab.closedIssues7d',
    });
  });

  it('should lock merge request metric ids', () => {
    expect(GITLAB_MERGE_REQUESTS_METRIC_IDS).toEqual({
      OPEN_MRS: 'gitlab.openMergeRequests',
      OPENED_MRS_7D: 'gitlab.openedMergeRequests7d',
      CLOSED_MRS_7D: 'gitlab.closedMergeRequests7d',
    });
  });

  it('should lock pipelines metric ids', () => {
    expect(GITLAB_PIPELINES_METRIC_IDS).toEqual({
      STARTED_7D: 'gitlab.startedPipelines7d',
      SUCCESSFUL_7D: 'gitlab.successfulPipelines7d',
      FAILED_7D: 'gitlab.failedPipelines7d',
      SUCCESS_RATIO_7D: 'gitlab.pipelineSuccessRatio7d',
      SUCCESS_RATIO_24H: 'gitlab.pipelineSuccessRatio24h',
    });
  });

  it('should lock jobs metric ids', () => {
    expect(GITLAB_JOBS_METRIC_IDS).toEqual({
      STARTED_7D: 'gitlab.startedJobs7d',
      SUCCESSFUL_7D: 'gitlab.successfulJobs7d',
      FAILED_7D: 'gitlab.failedJobs7d',
      SUCCESS_RATIO_7D: 'gitlab.jobSuccessRatio7d',
      SUCCESS_RATIO_24H: 'gitlab.jobSuccessRatio24h',
    });
  });

  it('should lock percentage threshold rules', () => {
    expect(GITLAB_PERCENTAGE_THRESHOLDS).toEqual({
      rules: [
        { key: 'error', expression: '<50' },
        { key: 'warning', expression: '50-80' },
        { key: 'success', expression: '>80' },
      ],
    });
  });
});
