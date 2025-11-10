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

import { MetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

export const mockScorecardSuccessData = [
  {
    id: 'github.open_prs',
    status: 'success' as const,
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
          rules: [
            { key: 'success', expression: '< 10' },
            { key: 'warning', expression: '10-50' },
            { key: 'error', expression: '> 50' },
          ],
        },
        status: 'success' as const,
        evaluation: 'success',
      },
    },
  },
  {
    id: 'jira.open_issues',
    status: 'success' as const,
    metadata: {
      title: 'Jira open blocking tickets',
      description:
        'Highlights the number of critical, blocking issues that are currently open in Jira.',
      type: 'number',
      history: true,
    },
    result: {
      value: 22,
      timestamp: '2025-08-08T10:00:00Z',
      thresholdResult: {
        definition: {
          rules: [
            { key: 'success', expression: '< 10' },
            { key: 'warning', expression: '10-80' },
            { key: 'error', expression: '> 80' },
          ],
        },
        evaluation: 'warning',
        status: 'success' as const,
      },
    },
  },
] as MetricResult[];

export const mockScorecardErrorData = [
  {
    id: 'github.open_issues',
    status: 'error' as const,
    metadata: {
      title: 'GitHub open Issues',
      description:
        'Current count of open issues for a given GitHub repository.',
      type: 'number',
      history: true,
    },
    result: {
      value: undefined,
      timestamp: '2025-08-08T10:00:00Z',
      thresholdResult: {
        definition: {
          rules: [
            { key: 'success', expression: '< 10' },
            { key: 'warning', expression: '10-50' },
            { key: 'error', expression: '> 50' },
          ],
        },
        status: 'error' as const,
        error: 'Unable to evaluate thresholds, metric value is missing',
      },
    },
    error: 'HttpError: API rate limit exceeded.',
  },
  {
    id: 'sonar.security_issues',
    status: 'success' as const,
    metadata: {
      title: 'Sonar number of security issues',
      description: 'Highlights the number of security issues in Sonar.',
      type: 'number',
      history: true,
    },
    result: {
      value: 12,
      timestamp: '2025-08-08T10:00:00Z',
      thresholdResult: {
        definition: {
          rules: [
            { key: 'success', expression: '< 10' },
            { key: 'warning', expression: '10-50' },
            { key: 'error', expression: '>- 50' },
          ],
        },
        evaluation: 'warning',
        status: 'error' as const,
        error:
          "ThresholdConfigFormatError: Invalid threshold annotation 'scorecard.io/sonar.security_issues.thresholds.rules.error: >- 50' in entity 'component:default/example-service': Invalid threshold expression: >- 50.",
      },
    },
  },
] as MetricResult[];
