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
import { aggregationTypes } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

// Inline default thresholds for e2e mocks (matches scorecard-common DEFAULT_NUMBER_THRESHOLDS)
const DEFAULT_NUMBER_THRESHOLDS = {
  rules: [
    { key: 'success', expression: '<10' },
    { key: 'warning', expression: '10-50' },
    { key: 'error', expression: '>50' },
  ],
};

export const customScorecardResponse = [
  {
    id: 'github.open_prs',
    status: 'success',
    metadata: {
      title: 'GitHub open PRs',
      description:
        'Current count of open Pull Requests for a given GitHub repository.',
      type: 'number',
      history: true,
    },
    result: {
      value: 9,
      timestamp: '2025-09-08T09:08:55.629Z',
      thresholdResult: {
        definition: {
          rules: [
            { key: 'error', expression: '>=200' },
            { key: 'warning', expression: '10-200' },
            { key: 'success', expression: '<10' },
          ],
        },
        status: 'success',
        evaluation: 'success',
      },
    },
  },
  {
    id: 'jira.open_issues',
    status: 'success',
    metadata: {
      title: 'Jira open blocking tickets',
      description:
        'Highlights the number of critical, blocking issues that are currently open in Jira.',
      type: 'number',
      history: true,
    },
    result: {
      value: 8,
      timestamp: '2025-09-08T09:08:55.629Z',
      thresholdResult: {
        definition: {
          rules: [
            { key: 'error', expression: '>=50' },
            { key: 'warning', expression: '10-50' },
            { key: 'success', expression: '<10' },
          ],
        },
        status: 'success',
        evaluation: 'success',
      },
    },
  },
];

export const emptyScorecardResponse = [];

const jiraOpenIssues = {
  id: 'jira.open_issues',
  status: 'success',
  metadata: {
    title: 'Jira open blocking tickets',
    description:
      'Highlights the number of critical, blocking issues that are currently open in Jira.',
    type: 'number',
    history: true,
  },
  result: {
    value: 54,
    timestamp: '2025-09-12T15:28:56.898Z',
    thresholdResult: {
      definition: {
        rules: [
          {
            key: 'error',
            expression: '>50',
          },
          {
            key: 'warning',
            expression: '10-50',
          },
          {
            key: 'success',
            expression: '<10',
          },
        ],
      },
      status: 'success',
      evaluation: 'error',
    },
  },
};

export const unavailableMetricResponse = [
  jiraOpenIssues,
  {
    id: 'github.open_prs',
    status: 'error',
    metadata: {
      title: 'GitHub open PRs',
      description:
        'Current count of open Pull Requests for a given GitHub repository.',
      type: 'number',
      history: true,
    },
    error:
      "HttpError: API rate limit exceeded for 157.50.94.55. (But here's the good news: Authenticated requests get a higher rate limit. Check out the documentation for more details.) - https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting",
    result: {
      timestamp: '2025-09-23T12:17:02.496Z',
      thresholdResult: {
        definition: {
          rules: [
            {
              key: 'success',
              expression: '<10',
            },
            {
              key: 'warning',
              expression: '10-50',
            },
            {
              key: 'error',
              expression: '>50',
            },
          ],
        },
        status: 'error',
        error: 'Unable to evaluate thresholds, metric value is missing',
      },
    },
  },
];

export const invalidThresholdResponse = [
  jiraOpenIssues,
  {
    id: 'github.open_prs',
    status: 'success',
    metadata: {
      title: 'GitHub open PRs',
      description:
        'Current count of open Pull Requests for a given GitHub repository.',
      type: 'number',
      history: true,
    },
    result: {
      value: 40,
      timestamp: '2025-09-23T12:27:04.531Z',
      thresholdResult: {
        status: 'error',
        error:
          "ThresholdConfigFormatError: Invalid threshold annotation 'scorecard.io/github.open_prs.thresholds.rules.warning: 10--15' in entity 'component:default/all-scorecards-service': Invalid threshold expression: \"10--15\".",
      },
    },
  },
];

export const notAllowedAggregationErrorBody = {
  error: { name: 'NotAllowedError', message: 'Permission denied' },
};

export const openPrsKpiMetadataResponse = {
  title: 'GitHub open PRs',
  description:
    'Current count of open Pull Requests for a given GitHub repository.',
  type: 'number',
  history: true,
  aggregationType: 'statusGrouped',
};

export const openIssuesKpiMetadataResponse = {
  title: 'Jira open blocking tickets',
  description:
    'Highlights the number of critical, blocking issues that are currently open in Jira.',
  type: 'number',
  history: true,
  aggregationType: 'statusGrouped',
};

/** Matches `scorecard.aggregationKPIs.openPrsWeightedKpi` in app-config.yaml */
export const openPrsWeightedKpiMetadataResponse = {
  title: 'GitHub Open PRs (weighted health)',
  description:
    'Weighted health average for open PRs by threshold status across your entities.',
  type: 'number',
  history: true,
  aggregationType: aggregationTypes.average,
};

/**
 * Average KPI: 3×100 + 5×40 + 2×0 = 500 weighted sum; max 100×10 entities → 50% score.
 * Colors align with aggregation KPI `options.thresholds` warning band (30–79%) in app-config.
 */
export const openPrsWeightedAggregatedResponse = {
  id: 'github.open_prs',
  status: 'success' as const,
  metadata: {
    ...openPrsWeightedKpiMetadataResponse,
  },
  result: {
    values: [
      { count: 3, name: 'success', score: 100 },
      { count: 5, name: 'warning', score: 40 },
      { count: 2, name: 'error', score: 0 },
    ],
    total: 10,
    timestamp: '2026-01-24T14:10:32.858Z',
    thresholds: DEFAULT_NUMBER_THRESHOLDS,
    averageScore: 50,
    averageWeightedSum: 500,
    averageMaxPossible: 1000,
    aggregationChartDisplayColor: 'rgb(224, 189, 108)',
  },
};

export const emptyOpenPrsWeightedAggregatedResponse = {
  id: 'github.open_prs',
  status: 'success' as const,
  metadata: {
    ...openPrsWeightedKpiMetadataResponse,
  },
  result: {
    total: 0,
    values: [
      { count: 0, name: 'success', score: 100 },
      { count: 0, name: 'warning', score: 40 },
      { count: 0, name: 'error', score: 0 },
    ],
    timestamp: '2026-01-24T14:10:32.858Z',
    thresholds: DEFAULT_NUMBER_THRESHOLDS,
    averageScore: 0,
    averageWeightedSum: 0,
    averageMaxPossible: 0,
    aggregationChartDisplayColor: '#6bb300',
  },
};

/** Deliberately unknown `aggregationType` for UnsupportedAggregationType UI tests. */
export const openPrsWeightedUnsupportedAggregationResponse = {
  id: 'github.open_prs',
  status: 'success' as const,
  metadata: {
    ...openPrsWeightedKpiMetadataResponse,
    aggregationType: 'customUnknownAggregationKind',
  },
  result: openPrsWeightedAggregatedResponse.result,
};

// Aggregated scorecard mocks: 10 GitHub entities, 10 Jira entities (totals in `result`)
/** Response for GET /api/scorecard/metrics?metricIds=jira.open_issues (metric metadata only). */
export const jiraMetricMetadataResponse = {
  metrics: [
    {
      id: 'jira.open_issues',
      title: 'Jira open blocking tickets',
      description:
        'Highlights the number of issues that are currently open in Jira.',
      type: 'number',
      history: true,
    },
  ],
};

// SonarQube scorecard responses

function sonarqubeNumberMetric(
  id: string,
  title: string,
  description: string,
  value: number,
  thresholdRules: Array<{ key: string; expression: string }>,
  evaluation: string,
) {
  return {
    id,
    status: 'success',
    metadata: { title, description, type: 'number', history: true },
    result: {
      value,
      timestamp: '2025-09-08T09:08:55.629Z',
      thresholdResult: {
        definition: { rules: thresholdRules },
        status: 'success',
        evaluation,
      },
    },
  };
}

const ratingRules = [
  { key: 'a', expression: '<2' },
  { key: 'b', expression: '2-3' },
  { key: 'c', expression: '>3' },
  { key: 'd', expression: '>3' },
  { key: 'e', expression: '>3' },
];

const securityRules = [
  { key: 'success', expression: '==0' },
  { key: 'error', expression: '>=1' },
];

const issueRules = [
  { key: 'success', expression: '<1' },
  { key: 'warning', expression: '1-5' },
  { key: 'error', expression: '>5' },
];

export const sonarqubeScorecardResponse = [
  {
    id: 'sonarqube.quality_gate',
    status: 'success',
    metadata: {
      title: 'SonarQube Quality Gate Status',
      description: 'Whether the project passes its SonarQube quality gate.',
      type: 'boolean',
      history: true,
    },
    result: {
      value: true,
      timestamp: '2025-09-08T09:08:55.629Z',
      thresholdResult: {
        definition: {
          rules: [
            { key: 'success', expression: '==true' },
            { key: 'error', expression: '==false' },
          ],
        },
        status: 'success',
        evaluation: 'success',
      },
    },
  },
  sonarqubeNumberMetric(
    'sonarqube.open_issues',
    'SonarQube Open Issues',
    'Count of open issues (OPEN, CONFIRMED, REOPENED) in SonarQube.',
    3,
    [
      { key: 'success', expression: '<1' },
      { key: 'warning', expression: '1-10' },
      { key: 'error', expression: '>10' },
    ],
    'warning',
  ),
  sonarqubeNumberMetric(
    'sonarqube.security_rating',
    'SonarQube Security Rating',
    'SonarQube security rating.',
    1,
    ratingRules,
    'success',
  ),
  sonarqubeNumberMetric(
    'sonarqube.security_issues',
    'SonarQube Security Issues',
    'Count of open security vulnerabilities in SonarQube.',
    0,
    securityRules,
    'success',
  ),
  sonarqubeNumberMetric(
    'sonarqube.security_review_rating',
    'SonarQube Security Review Rating',
    'SonarQube security review rating.',
    1,
    ratingRules,
    'success',
  ),
  sonarqubeNumberMetric(
    'sonarqube.security_hotspots',
    'SonarQube Security Hotspots',
    'Count of security hotspots to review in SonarQube.',
    2,
    issueRules,
    'warning',
  ),
  sonarqubeNumberMetric(
    'sonarqube.reliability_rating',
    'SonarQube Reliability Rating',
    'SonarQube reliability rating.',
    1,
    ratingRules,
    'success',
  ),
  sonarqubeNumberMetric(
    'sonarqube.reliability_issues',
    'SonarQube Reliability Issues',
    'Count of open bugs in SonarQube.',
    0,
    issueRules,
    'success',
  ),
  sonarqubeNumberMetric(
    'sonarqube.maintainability_rating',
    'SonarQube Maintainability Rating',
    'SonarQube maintainability rating.',
    1,
    ratingRules,
    'success',
  ),
  sonarqubeNumberMetric(
    'sonarqube.maintainability_issues',
    'SonarQube Maintainability Issues',
    'Count of open code smells in SonarQube.',
    12,
    [
      { key: 'success', expression: '<10' },
      { key: 'warning', expression: '10-50' },
      { key: 'error', expression: '>50' },
    ],
    'warning',
  ),
  sonarqubeNumberMetric(
    'sonarqube.code_coverage',
    'SonarQube Code Coverage',
    'Overall code coverage percentage in SonarQube.',
    82.5,
    [
      { key: 'success', expression: '>80' },
      { key: 'warning', expression: '50-80' },
      { key: 'error', expression: '<50' },
    ],
    'success',
  ),
  sonarqubeNumberMetric(
    'sonarqube.code_duplications',
    'SonarQube Code Duplications',
    'Percentage of duplicated lines in SonarQube.',
    3.2,
    [
      { key: 'success', expression: '<3' },
      { key: 'warning', expression: '3-10' },
      { key: 'error', expression: '>10' },
    ],
    'warning',
  ),
];

export const sonarqubeFailedQualityGateResponse = [
  {
    ...sonarqubeScorecardResponse[0],
    result: {
      value: false,
      timestamp: '2025-09-08T09:08:55.629Z',
      thresholdResult: {
        definition: {
          rules: [
            { key: 'success', expression: '==true' },
            { key: 'error', expression: '==false' },
          ],
        },
        status: 'success',
        evaluation: 'error',
      },
    },
  },
  ...sonarqubeScorecardResponse.slice(1),
];

// Aggregated scorecard mocks: 10 GitHub entities, 10 Jira entities (totals in `result`)
export const githubAggregatedResponse = {
  id: 'github.open_prs',
  status: 'success',
  metadata: {
    title: 'GitHub open PRs',
    description:
      'Current count of open Pull Requests for a given GitHub repository.',
    type: 'number',
    history: true,
    aggregationType: 'statusGrouped',
  },
  result: {
    values: [
      { count: 3, name: 'success' },
      { count: 5, name: 'warning' },
      { count: 2, name: 'error' },
    ],
    total: 10,
    timestamp: '2026-01-24T14:10:32.858Z',
    thresholds: DEFAULT_NUMBER_THRESHOLDS,
    entitiesConsidered: 10,
    calculationErrorCount: 0,
  },
};

export const jiraAggregatedResponse = {
  id: 'jira.open_issues',
  status: 'success',
  metadata: {
    title: 'Jira open blocking tickets',
    description:
      'Highlights the number of critical, blocking issues that are currently open in Jira.',
    type: 'number',
    history: true,
    aggregationType: 'statusGrouped',
  },
  result: {
    values: [
      { count: 6, name: 'success' },
      { count: 3, name: 'warning' },
      { count: 1, name: 'error' },
    ],
    total: 10,
    timestamp: '2026-01-24T14:10:32.776Z',
    thresholds: DEFAULT_NUMBER_THRESHOLDS,
    entitiesConsidered: 10,
    calculationErrorCount: 0,
  },
};

export const emptyJiraAggregatedResponse = {
  id: 'jira.open_issues',
  status: 'success',
  metadata: {
    title: 'Jira open blocking tickets',
    description:
      'Highlights the number of critical, blocking issues that are currently open in Jira.',
    type: 'number',
    history: true,
    aggregationType: 'statusGrouped',
  },
  result: {
    total: 0,
    values: [
      { count: 0, name: 'success' },
      { count: 0, name: 'warning' },
      { count: 0, name: 'error' },
    ],
    timestamp: '2026-01-24T14:10:32.858Z',
    thresholds: DEFAULT_NUMBER_THRESHOLDS,
    entitiesConsidered: 0,
    calculationErrorCount: 0,
  },
};

export const emptyGithubAggregatedResponse = {
  id: 'github.open_prs',
  status: 'success',
  metadata: {
    title: 'GitHub open PRs',
    description:
      'Current count of open Pull Requests for a given GitHub repository.',
    type: 'number',
    history: true,
    aggregationType: 'statusGrouped',
  },
  result: {
    total: 0,
    values: [
      { count: 0, name: 'success' },
      { count: 0, name: 'warning' },
      { count: 0, name: 'error' },
    ],
    timestamp: '2026-01-24T14:10:32.858Z',
    thresholds: DEFAULT_NUMBER_THRESHOLDS,
    entitiesConsidered: 0,
    calculationErrorCount: 0,
  },
};

/** Mock response for GET .../api/scorecard/metrics/github.open_prs/catalog/aggregations/entities (10 entities, in sync with githubAggregatedResponse) */
export const githubEntitiesDrillDownResponse = {
  metricId: 'github.open_prs',
  metricMetadata: {
    title: 'GitHub open PRs',
    description:
      'Current count of open Pull Requests for a given GitHub repository.',
    type: 'number',
  },
  entities: [
    {
      entityRef: 'component:default/all-scorecards-service',
      entityNamespace: 'default',
      entityName: 'all-scorecards-service',
      entityKind: 'Component',
      owner: 'user:development/guest',
      metricValue: 46,
      timestamp: '2026-03-12T08:09:29.732Z',
      status: 'warning',
    },
    {
      entityRef: 'component:default/red-hat-developer-hub',
      entityNamespace: 'default',
      entityName: 'red-hat-developer-hub',
      entityKind: 'Component',
      owner: 'group:default/red-hat',
      metricValue: 50,
      timestamp: '2026-03-12T08:09:29.663Z',
      status: 'warning',
    },
    {
      entityRef: 'component:default/github-scorecard-only-service',
      entityNamespace: 'default',
      entityName: 'github-scorecard-only-service',
      entityKind: 'Component',
      owner: 'group:development/guests',
      metricValue: 46,
      timestamp: '2026-03-12T08:09:29.652Z',
      status: 'warning',
    },
    {
      entityRef: 'component:default/all-scorecards-service-different-owner',
      entityNamespace: 'default',
      entityName: 'all-scorecards-service-different-owner',
      entityKind: 'Component',
      owner: 'group:default/rhdh-team',
      metricValue: 46,
      timestamp: '2026-03-12T08:09:29.630Z',
      status: 'warning',
    },
    {
      entityRef: 'component:default/backend-api',
      entityNamespace: 'default',
      entityName: 'backend-api',
      entityKind: 'Component',
      owner: 'group:default/platform',
      metricValue: 12,
      timestamp: '2026-03-12T07:00:00.000Z',
      status: 'success',
    },
    {
      entityRef: 'component:default/frontend-app',
      entityNamespace: 'default',
      entityName: 'frontend-app',
      entityKind: 'Component',
      owner: 'group:default/frontend',
      metricValue: 28,
      timestamp: '2026-03-12T06:45:00.000Z',
      status: 'warning',
    },
    {
      entityRef: 'component:default/auth-service',
      entityNamespace: 'default',
      entityName: 'auth-service',
      entityKind: 'Component',
      owner: 'group:default/security',
      metricValue: 8,
      timestamp: '2026-03-12T06:30:00.000Z',
      status: 'success',
    },
    {
      entityRef: 'component:default/notifications-service',
      entityNamespace: 'default',
      entityName: 'notifications-service',
      entityKind: 'Component',
      owner: 'group:default/platform',
      metricValue: 95,
      timestamp: '2026-03-12T06:15:00.000Z',
      status: 'error',
    },
    {
      entityRef: 'component:default/search-indexer',
      entityNamespace: 'default',
      entityName: 'search-indexer',
      entityKind: 'Component',
      owner: 'group:default/data',
      metricValue: 22,
      timestamp: '2026-03-12T06:00:00.000Z',
      status: 'warning',
    },
    {
      entityRef: 'component:default/payment-gateway',
      entityNamespace: 'default',
      entityName: 'payment-gateway',
      entityKind: 'Component',
      owner: 'group:default/finance',
      metricValue: 3,
      timestamp: '2026-03-12T05:45:00.000Z',
      status: 'success',
    },
  ],
  pagination: {
    page: 1,
    pageSize: 10,
    total: 10,
    totalPages: 1,
    isCapped: false,
  },
  entityHealth: {
    totalEntities: 10,
    calculationErrorCount: 0,
    countsArePartial: false,
  },
};

/** Mock response for GET .../api/scorecard/metrics/jira.open_issues/catalog/aggregations/entities (in sync with jiraAggregatedResponse) */
export const jiraEntitiesDrillDownResponse = {
  metricId: 'jira.open_issues',
  metricMetadata: {
    title: 'Jira open blocking tickets',
    description:
      'Highlights the number of issues that are currently open in Jira.',
    type: 'number',
  },
  entities: [
    {
      entityRef: 'component:default/platform-api',
      entityNamespace: 'default',
      entityName: 'platform-api',
      entityKind: 'Component',
      owner: 'group:default/platform',
      metricValue: 15,
      timestamp: '2026-03-12T08:00:00.000Z',
      status: 'error',
    },
    {
      entityRef: 'component:default/backend-svc',
      entityNamespace: 'default',
      entityName: 'backend-svc',
      entityKind: 'Component',
      owner: 'group:default/platform',
      metricValue: 2,
      timestamp: '2026-03-12T07:00:00.000Z',
      status: 'success',
    },
    {
      entityRef: 'component:default/frontend-svc',
      entityNamespace: 'default',
      entityName: 'frontend-svc',
      entityKind: 'Component',
      owner: 'group:default/frontend',
      metricValue: 12,
      timestamp: '2026-03-12T06:00:00.000Z',
      status: 'warning',
    },
    {
      entityRef: 'component:default/auth-svc',
      entityNamespace: 'default',
      entityName: 'auth-svc',
      entityKind: 'Component',
      owner: 'group:default/security',
      metricValue: 8,
      timestamp: '2026-03-12T05:00:00.000Z',
      status: 'warning',
    },
  ],
  pagination: {
    page: 1,
    pageSize: 10,
    total: 4,
    totalPages: 1,
    isCapped: false,
  },
  entityHealth: {
    totalEntities: 4,
    calculationErrorCount: 0,
    countsArePartial: false,
  },
};

/** Mock response for Jira entities drill-down when aggregation has no data (empty list). */
export const jiraEntitiesDrillDownNoDataResponse = {
  metricId: 'jira.open_issues',
  metricMetadata: {
    title: 'Jira open blocking tickets',
    description:
      'Highlights the number of issues that are currently open in Jira.',
    type: 'number',
  },
  entities: [],
  pagination: {
    page: 1,
    pageSize: 5,
    total: 0,
    totalPages: 0,
    isCapped: false,
  },
  entityHealth: {
    totalEntities: 0,
    calculationErrorCount: 0,
    countsArePartial: false,
  },
};

export const fileCheckScorecardResponse = [
  {
    id: 'filecheck.readme',
    status: 'success',
    metadata: {
      title: 'GitHub File: README.md',
      description: 'Checks if README.md exists in the repository.',
      type: 'boolean',
      history: true,
    },
    result: {
      value: true,
      timestamp: '2025-09-08T09:08:55.629Z',
      thresholdResult: {
        definition: {
          rules: [
            {
              key: 'exist',
              expression: '==true',
              color: 'success.main',
              icon: 'scorecardSuccessStatusIcon',
            },
            {
              key: 'missing',
              expression: '==false',
              color: 'error.main',
              icon: 'scorecardErrorStatusIcon',
            },
          ],
        },
        status: 'success',
        evaluation: 'exist',
      },
    },
  },
  {
    id: 'filecheck.codeowners',
    status: 'success',
    metadata: {
      title: 'GitHub File: CODEOWNERS',
      description: 'Checks if CODEOWNERS exists in the repository.',
      type: 'boolean',
      history: true,
    },
    result: {
      value: false,
      timestamp: '2025-09-08T09:08:55.629Z',
      thresholdResult: {
        definition: {
          rules: [
            {
              key: 'exist',
              expression: '==true',
              color: 'success.main',
              icon: 'scorecardSuccessStatusIcon',
            },
            {
              key: 'missing',
              expression: '==false',
              color: 'error.main',
              icon: 'scorecardErrorStatusIcon',
            },
          ],
        },
        status: 'success',
        evaluation: 'missing',
      },
    },
  },
];
