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
import { DEFAULT_NUMBER_THRESHOLDS } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

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
  { key: 'success', expression: '<2' },
  { key: 'warning', expression: '2-3' },
  { key: 'error', expression: '>3' },
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
      description:
        'Whether the project passes its SonarQube quality gate (true = OK, false = ERROR).',
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
    'SonarQube security rating (A=1, B=2, C=3, D=4, E=5).',
    1,
    ratingRules,
    'success',
  ),
  sonarqubeNumberMetric(
    'sonarqube.security_issues',
    'SonarQube Security Issues',
    'Count of open security vulnerabilities in SonarQube.',
    0,
    issueRules,
    'success',
  ),
  sonarqubeNumberMetric(
    'sonarqube.security_review_rating',
    'SonarQube Security Review Rating',
    'SonarQube security review rating (A=1, B=2, C=3, D=4, E=5).',
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
    'SonarQube reliability rating (A=1, B=2, C=3, D=4, E=5).',
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
    'SonarQube maintainability rating (A=1, B=2, C=3, D=4, E=5).',
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

// Aggregated scorecard responses (15 GitHub entities, 10 Jira entities)
export const githubAggregatedResponse = {
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
    values: [
      { count: 5, name: 'success' },
      { count: 7, name: 'warning' },
      { count: 3, name: 'error' },
    ],
    total: 15,
    timestamp: '2026-01-24T14:10:32.858Z',
    thresholds: DEFAULT_NUMBER_THRESHOLDS,
  },
};

export const jiraAggregatedResponse = {
  id: 'jira.open_issues',
  status: 'success',
  metadata: {
    title: 'Jira open blocking tickets',
    description:
      'Highlights the number of issues that are currently open in Jira.',
    type: 'number',
    history: true,
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
  },
};
