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

import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { MetricProvidersRegistry } from '../src/providers/MetricProvidersRegistry';
import { Metric } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

export const mockMetricProvidersRegistry = {
  register: jest.fn(),
  getProvider: jest.fn(),
  getMetric: jest.fn(),
  calculateMetric: jest.fn(),
  calculateMetrics: jest.fn(),
  listProviders: jest.fn().mockReturnValue([]),
  listMetrics: jest.fn().mockReturnValue([]),
} as unknown as jest.Mocked<MetricProvidersRegistry>;

type BuildMockMetricProvidersRegistryParams = {
  provider?: MetricProvider;
  metricsList?: Metric[];
};

export const buildMockMetricProvidersRegistry = ({
  provider,
  metricsList,
}: BuildMockMetricProvidersRegistryParams) => {
  const getProvider = provider
    ? jest.fn().mockReturnValue(provider)
    : jest.fn();
  const listMetrics = metricsList
    ? jest.fn().mockImplementation((metricIds?: string[]) => {
        if (metricIds && metricIds.length !== 0) {
          return metricsList.filter(metric => metricIds.includes(metric.id));
        }
        return metricsList;
      })
    : jest.fn();

  return {
    ...mockMetricProvidersRegistry,
    getProvider,
    listMetrics,
  } as unknown as jest.Mocked<MetricProvidersRegistry>;
};
