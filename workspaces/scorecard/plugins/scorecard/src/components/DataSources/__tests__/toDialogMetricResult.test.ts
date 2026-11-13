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

import { toDialogMetricResult } from '../toDialogMetricResult';

describe('toDialogMetricResult', () => {
  it('builds a MetricResult for the data sources dialog', () => {
    const result = toDialogMetricResult({
      id: 'github.openPRs',
      title: 'GitHub Open PRs',
      description: 'Current count of open Pull Requests',
      type: 'number',
      unit: undefined,
      value: 12,
      timestamp: '2026-09-22T00:00:00.000Z',
      evaluation: 'warning',
      thresholds: {
        rules: [
          { key: 'success', expression: '<10' },
          { key: 'warning', expression: '10-50' },
        ],
      },
    });

    expect(result).toEqual({
      id: 'github.openPRs',
      status: 'success',
      metadata: {
        title: 'GitHub Open PRs',
        description: 'Current count of open Pull Requests',
        type: 'number',
        unit: undefined,
      },
      result: {
        value: 12,
        timestamp: '2026-09-22T00:00:00.000Z',
        thresholdResult: {
          status: 'success',
          evaluation: 'warning',
          definition: {
            rules: [
              { key: 'success', expression: '<10' },
              { key: 'warning', expression: '10-50' },
            ],
          },
        },
      },
    });
  });
});
