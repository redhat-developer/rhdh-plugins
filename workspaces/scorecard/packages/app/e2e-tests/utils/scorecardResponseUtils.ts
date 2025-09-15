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
export const customScorecardResponse = [
  {
    id: 'github.open-prs',
    status: 'success',
    metadata: {
      title: 'Github open PRs',
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
    id: 'jira.open-issues',
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

export const jiraOnlyScorecardResponse = [
  {
    id: 'github.open-prs',
    status: 'error',
    metadata: {
      title: 'Github open PRs',
      description:
        'Current count of open Pull Requests for a given GitHub repository.',
      type: 'number',
      history: true,
    },
    error:
      "Error: Missing annotation 'github.com/project-slug' for entity component:default/jira-scorecard-only-service",
  },
  {
    id: 'jira.open-issues',
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
  },
];

export const githubOnlyScorecardResponse = [
  {
    id: 'github.open-prs',
    status: 'success',
    metadata: {
      title: 'Github open PRs',
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
    id: 'jira.open-issues',
    status: 'error',
    metadata: {
      title: 'Jira open blocking tickets',
      description:
        'Highlights the number of critical, blocking issues that are currently open in Jira.',
      type: 'number',
      history: true,
    },
    error:
      "Error: Missing annotation 'jira.com/project-slug' for entity component:default/github-scorecard-only-service",
  },
];
