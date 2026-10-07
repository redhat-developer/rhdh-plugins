/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/License-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ScorecardThresholdRuleColors } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { mockT } from '../../../test-utils/mockTranslations';
import {
  getEvaluationKeyFromChartColor,
  getMetricCheckDescription,
  toAggregatedDialogMetricResult,
} from '../toAggregatedDialogMetricResult';

describe('toAggregatedDialogMetricResult', () => {
  const rules = [
    {
      key: 'success',
      expression: '<10',
      color: ScorecardThresholdRuleColors.SUCCESS,
    },
    {
      key: 'warning',
      expression: '10-50',
      color: ScorecardThresholdRuleColors.WARNING,
    },
  ];

  it('uses the metric check description, not a card/KPI description', () => {
    const result = toAggregatedDialogMetricResult({
      t: mockT as any,
      metricId: 'github.openPRs',
      cardTitle: 'Open PRs KPI',
      type: 'number',
      timestamp: '2026-01-01T00:00:00.000Z',
      value: 12,
      evaluation: 'warning',
      thresholds: { rules },
    });

    expect(result.metadata.description).toBe(
      'Current count of open Pull Requests for a given GitHub repository.',
    );
    expect(result.metadata.description).not.toBe(
      'Sum of open PRs across owned repositories.',
    );
    expect(result.result.value).toBe(12);
    expect(result.result.thresholdResult.evaluation).toBe('warning');
  });

  it('omits value and status for aggregations that do not provide them', () => {
    const result = toAggregatedDialogMetricResult({
      t: mockT as any,
      metricId: 'github.openPRs',
      cardTitle: 'Open PRs KPI',
      type: 'number',
      timestamp: '2026-01-01T00:00:00.000Z',
      value: 37,
      evaluation: 'success',
      thresholds: { rules },
      includeValueAndStatus: false,
    });

    expect(result.result.value).toBeNull();
    expect(result.result.thresholdResult.evaluation).toBeNull();
    expect(result.result.thresholdResult.definition).toBeUndefined();
    expect(result.metadata.description).toBe(
      'Current count of open Pull Requests for a given GitHub repository.',
    );
  });
});

describe('getMetricCheckDescription', () => {
  it('resolves the built-in metric description', () => {
    expect(getMetricCheckDescription(mockT as any, 'github.openPRs')).toBe(
      'Current count of open Pull Requests for a given GitHub repository.',
    );
  });

  it('returns empty string for custom metrics without a translation', () => {
    expect(getMetricCheckDescription(mockT as any, 'acme.customCheck')).toBe(
      '',
    );
  });
});

describe('getEvaluationKeyFromChartColor', () => {
  it('returns the matching threshold key', () => {
    expect(
      getEvaluationKeyFromChartColor('warning.main', [
        { key: 'success', expression: '<10', color: 'success.main' },
        { key: 'warning', expression: '10-50', color: 'warning.main' },
      ]),
    ).toBe('warning');
  });

  it('returns null when the color is missing', () => {
    expect(
      getEvaluationKeyFromChartColor(null, [
        { key: 'success', expression: '<10', color: 'success.main' },
      ]),
    ).toBeNull();
  });
});
