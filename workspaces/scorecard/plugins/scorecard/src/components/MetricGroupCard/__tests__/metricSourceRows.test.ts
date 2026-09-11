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
import { toMetricSourceRows } from '../metricSourceRows';

jest.mock('../../../utils', () => ({
  getStatusConfig: () => ({
    color: 'success.main',
    icon: 'scorecardSuccessStatusIcon',
  }),
  getLastUpdatedLabel: () => '1 hour ago',
  extractPluginName: () => 'Sonarqube',
  resolveMetricTranslation: (
    _t: unknown,
    _id: string,
    _field: string,
    fallback?: string,
  ) => fallback ?? '',
}));

jest.mock('../thresholdBucketUtils', () => ({
  MISSING_EVALUATION_BUCKET_KEY: 'noEvaluation',
  MISSING_EVALUATION_LABEL: '—',
  getMetricBucketKey: (metric: {
    result?: { thresholdResult?: { evaluation?: string | null } };
  }) => metric.result?.thresholdResult?.evaluation ?? 'noEvaluation',
  hasMetricEvaluation: (metric: {
    result?: { thresholdResult?: { evaluation?: string | null } };
  }) => Boolean(metric.result?.thresholdResult?.evaluation),
  getMetricBucketLabel: (bucketKey: string) =>
    bucketKey === 'noEvaluation' ? '—' : bucketKey,
}));

const mockMetrics: MetricResult[] = [
  {
    id: 'sonarqube.reliabilityIssues',
    status: 'success',
    metadata: {
      title: 'SonarQube Reliability Issues',
      description: 'Count of open bugs in SonarQube.',
      type: 'number',
      history: true,
    },
    result: {
      value: 8,
      timestamp: '2026-07-01T08:29:09.683Z',
      thresholdResult: {
        definition: {
          rules: [
            { key: 'success', expression: '<1' },
            { key: 'warning', expression: '1-5' },
            { key: 'error', expression: '>5' },
          ],
        },
        status: 'success',
        evaluation: 'error',
      },
    },
  },
  {
    id: 'sonarqube.codeCoverage',
    status: 'success',
    metadata: {
      title: 'SonarQube Code Coverage',
      description: 'Code coverage percentage.',
      type: 'number',
      history: true,
    },
    result: {
      value: 72,
      timestamp: '2026-07-01T08:29:09.683Z',
      thresholdResult: {
        definition: {
          rules: [
            { key: 'success', expression: '>=80' },
            { key: 'warning', expression: '60-79' },
            { key: 'error', expression: '<60' },
          ],
        },
        status: 'success',
        evaluation: 'warning',
      },
    },
  },
];

describe('toMetricSourceRows', () => {
  it('maps metric results into data-source rows', () => {
    const rows = toMetricSourceRows(mockMetrics, {
      t: mockT as any,
      locale: 'en',
    });

    expect(rows).toHaveLength(2);
    expect(rows[0].plugin).toBe('Sonarqube');
    expect(rows[0].metricId).toBe('sonarqube.reliabilityIssues');
    expect(rows[0].metricDescription).toBe('Count of open bugs in SonarQube.');
    expect(rows[0].value).toBe('8');
    expect(rows[0].statusLabel).toBe('error');
    expect(rows[0].evaluationKey).toBe('error');
    expect(rows[0].thresholdExpression).toBe('>5');
    expect(rows[0].lastSynced).toBe('1 hour ago');
    expect(rows[1].value).toBe('72');
    expect(rows[1].statusLabel).toBe('warning');
  });

  it('uses placeholders when a metric has no value or evaluation', () => {
    const metricsWithNull: MetricResult[] = [
      {
        id: 'sonarqube.nullMetric',
        status: 'error',
        metadata: {
          title: 'Null Metric',
          description: 'A metric with no result value.',
          type: 'number',
          history: false,
        },
        result: {
          value: null as unknown as number,
          timestamp: '2026-07-01T08:29:09.683Z',
          thresholdResult: {
            definition: { rules: [{ key: 'success', expression: '<1' }] },
            status: 'success',
            evaluation: null as unknown as string,
          },
        },
      },
    ];

    const rows = toMetricSourceRows(metricsWithNull, {
      t: mockT as any,
      locale: 'en',
    });

    expect(rows[0].value).toBe('—');
    expect(rows[0].statusLabel).toBe('—');
    expect(rows[0].evaluationKey).toBe('noEvaluation');
    expect(rows[0].statusIcon).toBe('');
    expect(rows[0].thresholdExpression).toBeNull();
  });
});
