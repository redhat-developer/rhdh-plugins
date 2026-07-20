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
  jiraMetricId: 'jira.openIssues',
  githubMetricId: 'github.openPRs',
  githubOpenPrsKpi: 'openPrsKpi',
  jiraOpenIssuesKpi: 'openIssuesKpi',
  gitHubOpenPrsWeightedKpi: 'openPrsWeightedKpi',
} as const;

/** Must match `title` in App.tsx homepage widget config (Add widget picker). */
export const AGGREGATED_CARDS_WIDGET_TITLES = {
  jiraMetricId: 'Scorecard: With deprecated metricId property (Jira)',
  githubMetricId: 'Scorecard: With default aggregation config (GitHub)',
  githubOpenPrsKpi: 'Scorecard: GitHub open PRs',
  jiraOpenIssuesKpi: 'Scorecard: Jira open blocking tickets',
  gitHubOpenPrsWeightedKpi: 'Scorecard: GitHub open PRs (weighted health)',
} as const;

export const AGGREGATED_CARDS_METADATA = {
  jiraDeprecatedMetricId: {
    id: AGGREGATED_CARDS_METRIC_IDS.jiraMetricId,
    title: 'Scorecard: With deprecated metricId property (Jira)',
    metricId: 'jira.openIssues',
  },
  githubDefaultAggregation: {
    id: AGGREGATED_CARDS_METRIC_IDS.githubMetricId,
    title: 'Scorecard: With default aggregation config (GitHub)',
    metricId: 'github.openPRs',
  },
  jiraOpenIssuesKpi: {
    id: AGGREGATED_CARDS_METRIC_IDS.jiraOpenIssuesKpi,
    title: 'Scorecard: Jira open blocking tickets',
    metricId: 'jira.openIssues',
  },
  githubOpenPrsKpi: {
    id: AGGREGATED_CARDS_METRIC_IDS.githubOpenPrsKpi,
    title: 'Scorecard: GitHub open PRs',
    metricId: 'github.openPRs',
  },
  githubOpenPrsWeightedKpi: {
    id: AGGREGATED_CARDS_METRIC_IDS.gitHubOpenPrsWeightedKpi,
    title: 'Scorecard: GitHub open PRs (weighted health)',
    metricId: 'github.openPRs',
  },
} as const;
