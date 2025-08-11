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

export const mockData = {
  title: 'Scorecard for component:default/my_service',
  metrics: [
    {
      id: 'github.pull_requests_open',
      status: 'success',
      metadata: {
        title: 'GitHub open PRs',
        description:
          'Current count of open Pull Requests for a given GitHub repository.',
        type: 'number',
        history: true,
      },
      result: {
        value: 8,
        timestamp: '2025-08-08T10:00:00Z',
        thresholdResult: {
          definition: {
            type: 'DecisionTable',
            inputs: ['value'],
            rules: [
              { condition: '< 10', status: 'green', label: 'Ideal' },
              { condition: '10-50', status: 'orange', label: 'Warning' },
              { condition: '> 50', status: 'red', label: 'Critical' },
            ],
          },
          evaluation: {
            status: 'green',
            matchedRule: '< 10',
            label: 'Ideal',
          },
        },
      },
    },
    {
      id: 'github.pull_requests_open',
      status: 'success',
      metadata: {
        title: 'GitHub open PRs',
        description:
          'Current count of open Pull Requests for a given GitHub repository.',
        type: 'number',
        history: true,
      },
      result: {
        value: 22,
        timestamp: '2025-08-08T10:00:00Z',
        thresholdResult: {
          definition: {
            type: 'DecisionTable',
            inputs: ['value'],
            rules: [
              { condition: '< 10', status: 'green', label: 'Ideal' },
              { condition: '10-50', status: 'orange', label: 'Warning' },
              { condition: '> 50', status: 'red', label: 'Critical' },
            ],
          },
          evaluation: {
            status: 'orange',
            matchedRule: '10-50',
            label: 'Warning',
          },
        },
      },
    },
    {
      id: 'jira.issues_open',
      status: 'success',
      metadata: {
        title: 'Jira open blocking tickets',
        description:
          'Highlights the number of critical, blocking issues that are currently open in Jira.',
        type: 'number',
        history: true,
      },
      result: {
        value: 75,
        timestamp: '2025-08-08T10:00:00Z',
        thresholdResult: {
          definition: {
            type: 'DecisionTable',
            inputs: ['value'],
            rules: [
              { condition: '< 10', status: 'green', label: 'Ideal' },
              { condition: '10-50', status: 'orange', label: 'Warning' },
              { condition: '> 50', status: 'red', label: 'Critical' },
            ],
          },
          evaluation: {
            status: 'red',
            matchedRule: '> 50',
            label: 'Critical',
          },
        },
      },
    },
  ],
};

export async function fetchMockData() {
  await new Promise(r => setTimeout(r, 500));
  return mockData;
}
