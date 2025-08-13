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

import {
  Metric,
  MetricType,
  MetricValue,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

abstract class MockMetricProvider<T extends MetricType>
  implements MetricProvider<T>
{
  constructor(
    protected metricType: T,
    protected providerId: string,
    protected datasourceId: string,
    protected title: string,
    protected value: MetricValue<T>,
  ) {}

  getProviderDatasourceId(): string {
    return this.datasourceId;
  }

  getProviderId(): string {
    return this.providerId;
  }

  getMetric(): Metric<T> {
    const metric: Metric<T> = {
      id: this.providerId,
      title: this.title,
      type: this.metricType,
    };
    return metric;
  }

  async calculateMetric(): Promise<MetricValue<T>> {
    return this.value;
  }
}

export class MockNumberProvider extends MockMetricProvider<'number'> {
  constructor(
    providerId: string,
    datasourceId: string,
    title: string = 'Mock Number Metric',
    value: number = 42,
  ) {
    super('number', providerId, datasourceId, title, value);
  }
}

export class MockStringProvider extends MockMetricProvider<'string'> {
  constructor(
    providerId: string,
    datasourceId: string,
    title: string = 'Mock String Metric',
    value: string = 'test-value',
  ) {
    super('string', providerId, datasourceId, title, value);
  }
}
