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

export const AGGREGATED_CARDS_METRIC_IDS = {
  withDeprecatedMetricId: 'jira.open_issues',
  withDefaultAggregation: 'github.open_prs',
  withGithubOpenPrs: 'openPrsKpi',
} as const;

export const AGGREGATED_CARDS_WIDGET_TITLES = {
  /** Must match `title` in App.tsx homepage widget config (Add widget picker). */
  withDeprecatedMetricId: 'Scorecard: With deprecated metricId property (Jira)',
  withDefaultAggregation: 'Scorecard: With default aggregation config (GitHub)',
  withGithubOpenPrs: 'Scorecard: GitHub open PRs',
} as const;
