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

export const SCALAR_AGGREGATED_CARDS_METRIC_IDS = {
  totalOpenBugs: 'totalOpenBugs',
  avgOpenPrs: 'avgOpenPrs',
  entitiesWithOpenPrs: 'entitiesWithOpenPrs',
  maxOpenPrs: 'maxOpenPrs',
  minOpenPrs: 'minOpenPrs',
} as const;

/** Must match `title` in App.tsx homepage widget config (Add widget picker). */
export const SCALAR_AGGREGATED_CARDS_WIDGET_TITLES = {
  totalOpenBugs: 'Scorecard: Total open bugs',
  avgOpenPrs: 'Scorecard: Average open PRs',
  entitiesWithOpenPrs: 'Scorecard: Entities with open PRs',
  maxOpenPrs: 'Scorecard: Maximum open PRs',
  minOpenPrs: 'Scorecard: Minimum open PRs',
} as const;

export const SCALAR_AGGREGATED_CARDS_METADATA = {
  totalOpenBugs: {
    id: SCALAR_AGGREGATED_CARDS_METRIC_IDS.totalOpenBugs,
    title: SCALAR_AGGREGATED_CARDS_WIDGET_TITLES.totalOpenBugs,
    metricId: 'jira.openIssues' as const,
    type: 'sum' as const,
  },
  avgOpenPrs: {
    id: SCALAR_AGGREGATED_CARDS_METRIC_IDS.avgOpenPrs,
    title: SCALAR_AGGREGATED_CARDS_WIDGET_TITLES.avgOpenPrs,
    metricId: 'github.openPRs' as const,
    type: 'average' as const,
  },
  entitiesWithOpenPrs: {
    id: SCALAR_AGGREGATED_CARDS_METRIC_IDS.entitiesWithOpenPrs,
    title: SCALAR_AGGREGATED_CARDS_WIDGET_TITLES.entitiesWithOpenPrs,
    metricId: 'github.openPRs' as const,
    type: 'count' as const,
  },
  maxOpenPrs: {
    id: SCALAR_AGGREGATED_CARDS_METRIC_IDS.maxOpenPrs,
    title: SCALAR_AGGREGATED_CARDS_WIDGET_TITLES.maxOpenPrs,
    metricId: 'github.openPRs' as const,
    type: 'max' as const,
  },
  minOpenPrs: {
    id: SCALAR_AGGREGATED_CARDS_METRIC_IDS.minOpenPrs,
    title: SCALAR_AGGREGATED_CARDS_WIDGET_TITLES.minOpenPrs,
    metricId: 'github.openPRs' as const,
    type: 'min' as const,
  },
} as const;
