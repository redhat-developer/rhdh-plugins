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
    '**/api/scorecard/metrics/catalog/Component/default/red-hat-developer-hub',
  GITHUB_AGGREGATION_ROUTE:
    '**/api/scorecard/metrics/github.open_prs/catalog/aggregations',
  JIRA_AGGREGATION_ROUTE:
    '**/api/scorecard/metrics/jira.open_issues/catalog/aggregations',
  GITHUB_METRICS_API_ROUTE:
    '**/api/scorecard/metrics?metricIds=github.open_prs',
  JIRA_METRICS_API_ROUTE: '**/api/scorecard/metrics?metricIds=jira.open_issues',
} as const;
