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

import { AggregatedMetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

export const mockAggregatedScorecardSuccessData: AggregatedMetricResult[] = [
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
      values: [
        { count: 11, name: 'success' },
        { count: 14, name: 'warning' },
        { count: 12, name: 'error' },
      ],
      total: 37,
      timestamp: '2024-01-15T10:30:00Z',
    },
  },
  {
    id: 'jira.issues_open',
    status: 'success',
    metadata: {
      title: 'Open Jira Issues',
      description:
        'Highlights the number of critical, blocking issues that are currently open in Jira.',
      type: 'number',
      history: true,
    },
    result: {
      values: [
        { count: 4, name: 'success' },
        { count: 1, name: 'warning' },
        { count: 6, name: 'error' },
      ],
      total: 11,
      timestamp: '2024-01-15T10:30:00Z',
    },
  },
  {
    id: 'github.open_prs',
    status: 'success',
    metadata: {
      title: 'GitHub Open PRs',
      description:
        'Current count of open Pull Requests for a given GitHub repository.',
      type: 'number',
      history: true,
    },
    result: {
      values: [
        { count: 1, name: 'success' },
        { count: 3, name: 'warning' },
        { count: 10, name: 'error' },
      ],
      total: 14,
      timestamp: '2024-01-15T10:30:00Z',
    },
  },
];
