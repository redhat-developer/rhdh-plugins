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

import { mockServices } from '@backstage/backend-test-utils';
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import type { Entity } from '@backstage/catalog-model';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import {
  Metric,
  MetricType,
  MetricValue,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { BaseMetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

abstract class MockMetricProvider<
  T extends MetricType,
> extends BaseMetricProvider<T> {
  constructor(
    protected metricType: T,
    protected providerId: string,
    protected datasourceId: string,
    protected title: string,
    protected description: string,
    protected value: MetricValue<T>,
    thresholds: ThresholdConfig,
  ) {
    const mockTaskRunner = mockServices.scheduler
      .mock()
      .createScheduledTaskRunner({
        frequency: { minutes: 10 },
        timeout: { minutes: 15 },
      });

    super(
      mockServices.auth(),
      mockServices.logger.mock(),
      catalogServiceMock(),
      mockTaskRunner,
      {
        'metadata.annotations.mockMetricId.mockRequiredKey':
          CATALOG_FILTER_EXISTS,
      },
      thresholds,
    );
  }

  getProviderDatasourceId(): string {
    return this.datasourceId;
  }

  getProviderId(): string {
    return this.providerId;
  }

  supportsEntity(_: Entity): boolean {
    return true;
  }

  getMetric(): Metric<T> {
    const metric: Metric<T> = {
      id: this.providerId,
      title: this.title,
      description: this.description,
      type: this.metricType,
    };
    return metric;
  }

  async calculateMetric(_entity: Entity): Promise<MetricValue<T>> {
    return this.value;
  }
}

export class MockNumberProvider extends MockMetricProvider<'number'> {
  constructor(
    providerId: string,
    datasourceId: string,
    title: string = 'Mock Number Metric',
    description: string = 'Mock number description.',
    value: number = 42,
  ) {
    const thresholds = {
      rules: [
        { key: 'error', expression: '>40' },
        { key: 'warning', expression: '>20' },
        { key: 'success', expression: '<=20' },
      ],
    };
    super(
      'number',
      providerId,
      datasourceId,
      title,
      description,
      value,
      thresholds,
    );
  }
}

export class MockBooleanProvider extends MockMetricProvider<'boolean'> {
  constructor(
    providerId: string,
    datasourceId: string,
    title: string = 'Mock Boolean Metric',
    description: string = 'Mock boolean description.',
    value: boolean = false,
  ) {
    const thresholds = {
      rules: [
        { key: 'success', expression: '==true' },
        { key: 'error', expression: '==false' },
      ],
    };
    super(
      'boolean',
      providerId,
      datasourceId,
      title,
      description,
      value,
      thresholds,
    );
  }
}

export const githubNumberProvider = new MockNumberProvider(
  'github.number_metric',
  'github',
  'Github Number Metric',
);

export const githubNumberMetricMetadata = {
  history: undefined,
  title: 'Github Number Metric',
  description: 'Mock number description.',
  type: 'number' as const,
};

export const jiraBooleanProvider = new MockBooleanProvider(
  'jira.boolean_metric',
  'jira',
);

export const jiraBooleanMetricMetadata = {
  history: undefined,
  title: 'Mock Boolean Metric',
  description: 'Mock boolean description.',
  type: 'boolean' as const,
};
