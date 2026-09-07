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
  aggregationTypes,
  DEFAULT_NUMBER_THRESHOLDS,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

const scalarResultBase = {
  total: 8,
  entitiesConsidered: 8,
  calculationErrorCount: 0,
  timestamp: '2026-01-24T14:10:32.858Z',
  thresholds: DEFAULT_NUMBER_THRESHOLDS,
};

/** Matches `scorecard.aggregationKPIs.totalOpenBugs` in app-config.yaml */
export const totalOpenBugsKpiMetadataResponse = {
  title: 'Total Open Bugs',
  description: 'Sum of open issues across owned entities.',
  type: 'number',
  history: true,
  aggregationType: aggregationTypes.sum,
};

export const totalOpenBugsAggregatedResponse = {
  id: 'jira.openIssues',
  status: 'success',
  metadata: {
    ...totalOpenBugsKpiMetadataResponse,
  },
  result: {
    ...scalarResultBase,
    value: 47,
  },
};

export const totalOpenBugsPartiallyAggregatedResponse = {
  ...totalOpenBugsAggregatedResponse,
  result: {
    ...totalOpenBugsAggregatedResponse.result,
    total: 4,
    entitiesConsidered: 6,
    calculationErrorCount: 2,
  },
};

/** Matches `scorecard.aggregationKPIs.avgOpenPrs` in app-config.yaml */
export const avgOpenPrsKpiMetadataResponse = {
  title: 'Average Open PRs',
  description: 'Mean open PR count per entity.',
  type: 'number',
  history: true,
  aggregationType: aggregationTypes.average,
};

export const avgOpenPrsAggregatedResponse = {
  id: 'github.openPRs',
  status: 'success',
  metadata: {
    ...avgOpenPrsKpiMetadataResponse,
  },
  result: {
    ...scalarResultBase,
    value: 6,
  },
};

export const avgOpenPrsPartiallyAggregatedResponse = {
  ...avgOpenPrsAggregatedResponse,
  result: {
    ...avgOpenPrsAggregatedResponse.result,
    total: 4,
    entitiesConsidered: 6,
    calculationErrorCount: 2,
  },
};

/** Matches `scorecard.aggregationKPIs.entitiesWithOpenPrs` in app-config.yaml */
export const entitiesWithOpenPrsKpiMetadataResponse = {
  title: 'Entities with Open PRs',
  description:
    'This KPI provides a count of entities with a stored open-prs value.',
  type: 'number',
  history: true,
  aggregationType: aggregationTypes.count,
};

export const entitiesWithOpenPrsAggregatedResponse = {
  id: 'github.openPRs',
  status: 'success',
  metadata: {
    ...entitiesWithOpenPrsKpiMetadataResponse,
  },
  result: {
    ...scalarResultBase,
    value: 8,
  },
};

export const entitiesWithOpenPrsPartiallyAggregatedResponse = {
  ...entitiesWithOpenPrsAggregatedResponse,
  result: {
    ...entitiesWithOpenPrsAggregatedResponse.result,
    value: 4,
    total: 4,
    entitiesConsidered: 6,
    calculationErrorCount: 2,
  },
};

/** Matches `scorecard.aggregationKPIs.maxOpenPrs` in app-config.yaml */
export const maxOpenPrsKpiMetadataResponse = {
  title: 'Maximum Open PRs',
  description: 'This KPI provides a maximum open PR count per entity.',
  type: 'number',
  history: true,
  aggregationType: aggregationTypes.max,
};

export const maxOpenPrsAggregatedResponse = {
  id: 'github.openPRs',
  status: 'success',
  metadata: {
    ...maxOpenPrsKpiMetadataResponse,
  },
  result: {
    ...scalarResultBase,
    value: 25,
  },
};

export const maxOpenPrsPartiallyAggregatedResponse = {
  ...maxOpenPrsAggregatedResponse,
  result: {
    ...maxOpenPrsAggregatedResponse.result,
    total: 4,
    entitiesConsidered: 6,
    calculationErrorCount: 2,
  },
};

/** Matches `scorecard.aggregationKPIs.minOpenPrs` in app-config.yaml */
export const minOpenPrsKpiMetadataResponse = {
  title: 'Minimum Open PRs',
  description: 'Lowest open PR count among owned entities.',
  type: 'number',
  history: true,
  aggregationType: aggregationTypes.min,
};

export const minOpenPrsAggregatedResponse = {
  id: 'github.openPRs',
  status: 'success',
  metadata: {
    ...minOpenPrsKpiMetadataResponse,
  },
  result: {
    ...scalarResultBase,
    value: 1,
  },
};

export const minOpenPrsPartiallyAggregatedResponse = {
  ...minOpenPrsAggregatedResponse,
  result: {
    ...minOpenPrsAggregatedResponse.result,
    total: 4,
    entitiesConsidered: 6,
    calculationErrorCount: 2,
  },
};
