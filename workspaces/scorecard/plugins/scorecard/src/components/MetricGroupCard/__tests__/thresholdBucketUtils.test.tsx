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

import type { MetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { mockT } from '../../../test-utils/mockTranslations';
import { buildThresholdBuckets } from '../thresholdBucketUtils';

jest.mock('../../../utils', () => ({
  getTranslatedStatus: jest.fn(),
}));

jest.mock('../../../utils/thresholdUtils', () => ({
  getThresholdRuleColor: jest.fn(),
}));

import { getTranslatedStatus } from '../../../utils';
import { getThresholdRuleColor } from '../../../utils/thresholdUtils';

const mockedGetTranslatedStatus = getTranslatedStatus as jest.MockedFunction<
  typeof getTranslatedStatus
>;
const mockedGetThresholdRuleColor =
  getThresholdRuleColor as jest.MockedFunction<typeof getThresholdRuleColor>;

const thresholdRules = [
  { key: 'success', expression: '<1' },
  { key: 'warning', expression: '1-7' },
  { key: 'error', expression: '>7' },
];

function createMetric(
  id: string,
  evaluation: string | null,
  rules = thresholdRules,
): MetricResult {
  return {
    id,
    status: 'success',
    metadata: {
      title: id,
      description: `${id} description`,
      type: 'number',
    },
    result: {
      value: 5,
      timestamp: new Date().toISOString(),
      thresholdResult: {
        status: 'success',
        definition: { rules },
        evaluation,
      },
    },
  };
}

describe('buildThresholdBuckets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetTranslatedStatus.mockImplementation(key => key ?? '');
    mockedGetThresholdRuleColor.mockImplementation((_rules, key) => {
      const defaults: Record<string, string> = {
        success: 'success.main',
        warning: 'warning.main',
        error: 'error.main',
      };
      return defaults[key];
    });
  });

  it('should return empty array for empty metrics', () => {
    const result = buildThresholdBuckets([], mockT as any);
    expect(result).toEqual([]);
  });

  it('should return buckets only for evaluations that exist', () => {
    const metrics = [
      createMetric('m1', 'success'),
      createMetric('m2', 'warning'),
      createMetric('m3', 'success'),
    ];

    const result = buildThresholdBuckets(metrics, mockT as any);

    expect(result).toHaveLength(2);
    expect(result.map(b => b.key)).toEqual(['success', 'warning']);
  });

  it('should count metrics per evaluation key correctly', () => {
    const metrics = [
      createMetric('m1', 'success'),
      createMetric('m2', 'success'),
      createMetric('m3', 'warning'),
      createMetric('m4', 'error'),
    ];

    const result = buildThresholdBuckets(metrics, mockT as any);

    const countsByKey = Object.fromEntries(result.map(b => [b.key, b.count]));
    expect(countsByKey).toEqual({
      success: 2,
      warning: 1,
      error: 1,
    });
  });

  it('should handle metrics without threshold results', () => {
    const metricNoResult: MetricResult = {
      id: 'no-result',
      status: 'error',
      metadata: { title: 'no-result', description: '', type: 'number' },
      result: undefined as any,
    };
    const metricNoThreshold: MetricResult = {
      id: 'no-threshold',
      status: 'success',
      metadata: { title: 'no-threshold', description: '', type: 'number' },
      result: {
        value: 1,
        timestamp: new Date().toISOString(),
        thresholdResult: undefined as any,
      },
    };
    const metricWithData = createMetric('has-data', 'success');

    const result = buildThresholdBuckets(
      [metricNoResult, metricNoThreshold, metricWithData],
      mockT as any,
    );

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('success');
    expect(result[0].count).toBe(1);
  });

  it('should use correct label from getTranslatedStatus', () => {
    mockedGetTranslatedStatus.mockImplementation(key => {
      const labels: Record<string, string> = {
        success: 'Translated Success',
        warning: 'Translated Warning',
        error: 'Translated Error',
      };
      return labels[key ?? ''] ?? key ?? '';
    });

    const metrics = [
      createMetric('m1', 'success'),
      createMetric('m2', 'warning'),
      createMetric('m3', 'error'),
    ];
    const result = buildThresholdBuckets(metrics, mockT as any);

    expect(result[0].label).toBe('Translated Success');
    expect(result[1].label).toBe('Translated Warning');
    expect(result[2].label).toBe('Translated Error');
    expect(mockedGetTranslatedStatus).toHaveBeenCalledTimes(3);
  });

  it('should use correct color from getThresholdRuleColor', () => {
    mockedGetThresholdRuleColor.mockImplementation((_rules, key) => {
      const colors: Record<string, string> = {
        success: '#00ff00',
        warning: '#ffaa00',
        error: '#ff0000',
      };
      return colors[key];
    });

    const metrics = [
      createMetric('m1', 'success'),
      createMetric('m2', 'warning'),
      createMetric('m3', 'error'),
    ];
    const result = buildThresholdBuckets(metrics, mockT as any);

    expect(result[0].color).toBe('#00ff00');
    expect(result[1].color).toBe('#ffaa00');
    expect(result[2].color).toBe('#ff0000');
    expect(mockedGetThresholdRuleColor).toHaveBeenCalledTimes(3);
  });

  it("should fall back to 'error.main' when getThresholdRuleColor returns undefined", () => {
    mockedGetThresholdRuleColor.mockReturnValue(undefined);

    const metrics = [createMetric('m1', 'success')];
    const result = buildThresholdBuckets(metrics, mockT as any);

    result.forEach(bucket => {
      expect(bucket.color).toBe('error.main');
    });
  });

  it('should not include expression in bucket', () => {
    const metrics = [createMetric('m1', 'success')];
    const result = buildThresholdBuckets(metrics, mockT as any);

    expect(result[0]).not.toHaveProperty('expression');
  });
});
