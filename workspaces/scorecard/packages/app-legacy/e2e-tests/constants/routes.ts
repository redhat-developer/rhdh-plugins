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

export const ScorecardRoutes = {
  SCORECARD_API_ROUTE:
    '**/api/scorecard/metrics/catalog/Component/default/red-hat-developer-hub*',
  OPEN_PRS_KPI_METADATA_ROUTE:
    '**/api/scorecard/aggregations/openPrsKpi/metadata',
  OPEN_ISSUES_KPI_METADATA_ROUTE:
    '**/api/scorecard/aggregations/openIssuesKpi/metadata',
  OPEN_PRS_KPI_AGGREGATION_ROUTE: '**/api/scorecard/aggregations/openPrsKpi',
  OPEN_PRS_WEIGHTED_KPI_METADATA_ROUTE:
    '**/api/scorecard/aggregations/openPrsWeightedKpi/metadata',
  OPEN_PRS_WEIGHTED_KPI_AGGREGATION_ROUTE:
    '**/api/scorecard/aggregations/openPrsWeightedKpi',
  OPEN_ISSUES_KPI_AGGREGATION_ROUTE:
    '**/api/scorecard/aggregations/openIssuesKpi',
  /** Default aggregation when aggregationId is the metric id (no KPI entry). */
  JIRA_OPEN_ISSUES_METRIC_AGGREGATION_ROUTE:
    '**/api/scorecard/aggregations/jira.open_issues',
  GITHUB_OPEN_PRS_METRIC_AGGREGATION_ROUTE:
    '**/api/scorecard/aggregations/github.open_prs',
} as const;
