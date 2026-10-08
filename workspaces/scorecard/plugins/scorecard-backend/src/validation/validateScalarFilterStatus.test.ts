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

import { InputError } from '@backstage/errors';
import { mockServices } from '@backstage/backend-test-utils';
import { aggregationTypes } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { validateScalarFilterStatus } from './validateScalarFilterStatus';
import { ThresholdResolver } from '../threshold/ThresholdResolver';
import { MockNumberProvider } from '../../__fixtures__/mockProviders';
import { buildMockMetricProvidersRegistry } from '../../__fixtures__/mockMetricProvidersRegistry';
import { mockScalarAggregationConfig } from '../../__fixtures__/mockAggregationConfig';
import { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';

describe('validateScalarFilterStatus', () => {
  const aggregationId = 'testFilterStatus';
  const metricId = 'jira.openIssues';
  const provider = new MockNumberProvider(metricId, 'jira');
  const customThresholdsConfig = mockServices.rootConfig({
    data: {
      scorecard: {
        metricProviders: {
          jira: {
            openIssues: {
              thresholds: {
                rules: [
                  {
                    key: 'high',
                    expression: '>100',
                    color: 'error.main',
                    icon: 'scorecardErrorStatusIcon',
                  },
                  {
                    key: 'low',
                    expression: '<=100',
                    color: 'success.main',
                    icon: 'scorecardSuccessStatusIcon',
                  },
                ],
              },
            },
          },
        },
      },
    },
  });

  let registry: MetricProvidersRegistry;

  beforeEach(() => {
    registry = buildMockMetricProvidersRegistry({
      provider,
    });
  });

  function createThresholdResolver(rootConfig = mockServices.rootConfig({})) {
    return new ThresholdResolver(rootConfig, registry.listProviders());
  }

  it('should pass validation when filter is absent', () => {
    const aggregationConfig = mockScalarAggregationConfig(
      aggregationTypes.sum,
      {
        id: aggregationId,
        metricId,
      },
    );

    expect(() =>
      validateScalarFilterStatus({
        aggregationConfig,
        aggregationId,
        registry,
        thresholdResolver: createThresholdResolver(),
      }),
    ).not.toThrow();
  });

  it('should pass when filter.status matches a default threshold key', () => {
    const aggregationConfig = mockScalarAggregationConfig(
      aggregationTypes.sum,
      {
        id: aggregationId,
        metricId,
        filter: { status: 'error' },
      },
    );

    expect(() =>
      validateScalarFilterStatus({
        aggregationConfig,
        aggregationId,
        registry,
        thresholdResolver: createThresholdResolver(),
      }),
    ).not.toThrow();
  });

  it('should throw when filter.status is not a valid threshold key', () => {
    const aggregationConfig = mockScalarAggregationConfig(
      aggregationTypes.sum,
      {
        id: aggregationId,
        metricId,
        filter: { status: 'critical' },
      },
    );

    expect(() =>
      validateScalarFilterStatus({
        aggregationConfig,
        aggregationId,
        registry,
        thresholdResolver: createThresholdResolver(),
      }),
    ).toThrow(InputError);
    expect(() =>
      validateScalarFilterStatus({
        aggregationConfig,
        aggregationId,
        registry,
        thresholdResolver: createThresholdResolver(),
      }),
    ).toThrow(
      'Aggregation KPI "testFilterStatus" filter.status "critical" is not a threshold rule key for metric "jira.openIssues". Valid keys: error, warning, success.',
    );
  });

  it('should pass when filter.status matches an app-config threshold override key', () => {
    const aggregationConfig = mockScalarAggregationConfig(
      aggregationTypes.sum,
      {
        id: aggregationId,
        metricId,
        filter: { status: 'high' },
      },
    );

    expect(() =>
      validateScalarFilterStatus({
        aggregationConfig,
        aggregationId,
        registry,
        thresholdResolver: createThresholdResolver(customThresholdsConfig),
      }),
    ).not.toThrow();
  });

  it('should throw when filter.status is omitted from app-config threshold overrides', () => {
    const aggregationConfig = mockScalarAggregationConfig(
      aggregationTypes.sum,
      {
        id: aggregationId,
        metricId,
        filter: { status: 'error' },
      },
    );

    expect(() =>
      validateScalarFilterStatus({
        aggregationConfig,
        aggregationId,
        registry,
        thresholdResolver: createThresholdResolver(customThresholdsConfig),
      }),
    ).toThrow(InputError);
    expect(() =>
      validateScalarFilterStatus({
        aggregationConfig,
        aggregationId,
        registry,
        thresholdResolver: createThresholdResolver(customThresholdsConfig),
      }),
    ).toThrow(
      /filter\.status "error" is not a threshold rule key.*Valid keys: high, low/,
    );
  });
});
