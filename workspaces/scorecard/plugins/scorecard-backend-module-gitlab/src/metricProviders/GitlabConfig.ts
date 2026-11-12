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

import { ThresholdConfig } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

export const GITLAB_METRIC = 'gitlab';

export const GITLAB_PROVIDER_IDS = {
  ISSUES: `${GITLAB_METRIC}.issues`,
  MERGE_REQUESTS: `${GITLAB_METRIC}.mergeRequests`,
  PIPELINES: `${GITLAB_METRIC}.pipelines`,
  JOBS: `${GITLAB_METRIC}.jobs`,
} as const;

export const GITLAB_PIPELINES_METRIC_IDS = {
  STARTED_7D: `${GITLAB_METRIC}.startedPipelines7d`,
  SUCCESSFUL_7D: `${GITLAB_METRIC}.successfulPipelines7d`,
  FAILED_7D: `${GITLAB_METRIC}.failedPipelines7d`,
  SUCCESS_RATIO_7D: `${GITLAB_METRIC}.pipelineSuccessRatio7d`,
  SUCCESS_RATIO_24H: `${GITLAB_METRIC}.pipelineSuccessRatio24h`,
} as const;

export const GITLAB_PERCENTAGE_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'error', expression: '<50' },
    { key: 'warning', expression: '50-80' },
    { key: 'success', expression: '>80' },
  ],
} as const;

export const GITLAB_SUCCESS_COUNT_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'error', expression: '<10' },
    { key: 'warning', expression: '10-50' },
    { key: 'success', expression: '>50' },
  ],
} as const;

export const GITLAB_ISSUES_METRIC_IDS = {
  OPEN_ISSUES: `${GITLAB_METRIC}.openIssues`,
  OPENED_ISSUES_7D: `${GITLAB_METRIC}.openedIssues7d`,
  CLOSED_ISSUES_7D: `${GITLAB_METRIC}.closedIssues7d`,
} as const;

export const GITLAB_MERGE_REQUESTS_METRIC_IDS = {
  OPEN_MRS: `${GITLAB_METRIC}.openMergeRequests`,
  OPENED_MRS_7D: `${GITLAB_METRIC}.openedMergeRequests7d`,
  CLOSED_MRS_7D: `${GITLAB_METRIC}.closedMergeRequests7d`,
} as const;

export const GITLAB_JOBS_METRIC_IDS = {
  STARTED_7D: `${GITLAB_METRIC}.startedJobs7d`,
  SUCCESSFUL_7D: `${GITLAB_METRIC}.successfulJobs7d`,
  FAILED_7D: `${GITLAB_METRIC}.failedJobs7d`,
  SUCCESS_RATIO_7D: `${GITLAB_METRIC}.jobSuccessRatio7d`,
  SUCCESS_RATIO_24H: `${GITLAB_METRIC}.jobSuccessRatio24h`,
} as const;
