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

import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import type { Entity } from '@backstage/catalog-model';
import {
  Metric,
  MetricType,
  MetricValue,
  ThresholdConfig,
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
    protected description: string,
    protected value: MetricValue<T>,
  ) {}

  abstract getMetricThresholds(): ThresholdConfig;

  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return {
      'metadata.annotations.mock/key': CATALOG_FILTER_EXISTS,
    };
  }

  getProviderDatasourceId(): string {
    return this.datasourceId;
  }

  getProviderId(): string {
    return this.providerId;
  }

  getMetricType(): T {
    return this.metricType;
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
    super('number', providerId, datasourceId, title, description, value);
  }
  getMetricThresholds(): ThresholdConfig {
    return {
      rules: [
        { key: 'error', expression: '>40' },
        { key: 'warning', expression: '>20' },
        { key: 'success', expression: '<=20' },
      ],
    };
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
    super('boolean', providerId, datasourceId, title, description, value);
  }
  getMetricThresholds(): ThresholdConfig {
    return {
      rules: [
        { key: 'success', expression: '==true' },
        { key: 'error', expression: '==false' },
      ],
    };
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

/**
 * Mock batch provider that exposes multiple metrics
 */
export class MockBatchBooleanProvider implements MetricProvider<'boolean'> {
  private readonly metricConfigs: Array<{ id: string; path: string }>;

  constructor(
    private readonly datasourceId: string,
    private readonly providerIdPrefix: string,
    metricConfigs: Array<{ id: string; path: string }>,
  ) {
    this.metricConfigs = metricConfigs;
  }

  getProviderDatasourceId(): string {
    return this.datasourceId;
  }

  getProviderId(): string {
    return this.providerIdPrefix;
  }

  getMetricType(): 'boolean' {
    return 'boolean';
  }

  getMetricIds(): string[] {
    return this.metricConfigs.map(c => `${this.providerIdPrefix}.${c.id}`);
  }

  getMetrics(): Metric<'boolean'>[] {
    return this.metricConfigs.map(c => ({
      id: `${this.providerIdPrefix}.${c.id}`,
      title: `File: ${c.path}`,
      description: `Checks if ${c.path} exists.`,
      type: 'boolean' as const,
    }));
  }

  getMetric(): Metric<'boolean'> {
    return this.getMetrics()[0];
  }

  getMetricThresholds(): ThresholdConfig {
    return {
      rules: [
        { key: 'success', expression: '==true' },
        { key: 'error', expression: '==false' },
      ],
    };
  }

  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return {
      'metadata.annotations.mock/key': CATALOG_FILTER_EXISTS,
    };
  }

  async calculateMetric(_entity: Entity): Promise<boolean> {
    const results = await this.calculateMetrics(_entity);
    return results.get(this.getMetricIds()[0]) ?? false;
  }

  async calculateMetrics(_entity: Entity): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    for (const config of this.metricConfigs) {
      results.set(`${this.providerIdPrefix}.${config.id}`, true);
    }
    return results;
  }
}

export const githubBatchProvider = new MockBatchBooleanProvider(
  'github',
  'github.files_check',
  [
    { id: 'readme', path: 'README.md' },
    { id: 'license', path: 'LICENSE' },
    { id: 'codeowners', path: 'CODEOWNERS' },
  ],
);

export const githubBatchMetrics = [
  {
    id: 'github.files_check.readme',
    title: 'File: README.md',
    description: 'Checks if README.md exists.',
    type: 'boolean' as const,
  },
  {
    id: 'github.files_check.license',
    title: 'File: LICENSE',
    description: 'Checks if LICENSE exists.',
    type: 'boolean' as const,
  },
  {
    id: 'github.files_check.codeowners',
    title: 'File: CODEOWNERS',
    description: 'Checks if CODEOWNERS exists.',
    type: 'boolean' as const,
  },
];
