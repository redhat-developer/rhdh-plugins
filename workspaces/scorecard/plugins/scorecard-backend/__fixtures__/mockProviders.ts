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

type CatalogFilterValue = string | symbol | (string | symbol)[];

const BOOLEAN_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'success', expression: '==true' },
    { key: 'error', expression: '==false' },
  ],
};

const MOCK_CATALOG_FILTER: Record<string, CatalogFilterValue> = {
  'metadata.annotations.mock/key': CATALOG_FILTER_EXISTS,
};

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

  abstract getDefaultThresholds(): ThresholdConfig;

  getCatalogFilter(): Record<string, CatalogFilterValue> {
    return MOCK_CATALOG_FILTER;
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

  getMetrics(): Metric<T>[] {
    return [
      {
        id: this.providerId,
        title: this.title,
        description: this.description,
        type: this.metricType,
        thresholds: this.getDefaultThresholds(),
      },
    ];
  }

  async calculateMetrics(
    _entity: Entity,
  ): Promise<Map<string, MetricValue<T>>> {
    const results = new Map<string, MetricValue<T>>();
    results.set(this.providerId, this.value);
    return results;
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
  getDefaultThresholds(): ThresholdConfig {
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
  getDefaultThresholds(): ThresholdConfig {
    return BOOLEAN_THRESHOLDS;
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
  thresholds: {
    rules: [
      { key: 'error', expression: '>40' },
      { key: 'warning', expression: '>20' },
      { key: 'success', expression: '<=20' },
    ],
  },
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
  thresholds: {
    rules: [
      { key: 'success', expression: '==true' },
      { key: 'error', expression: '==false' },
    ],
  },
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

  getMetrics(): Metric<'boolean'>[] {
    return this.metricConfigs.map(c => ({
      id: `${this.providerIdPrefix}.${c.id}`,
      title: `File: ${c.path}`,
      description: `Checks if ${c.path} exists.`,
      type: 'boolean' as const,
      thresholds: BOOLEAN_THRESHOLDS,
    }));
  }

  getCatalogFilter(): Record<string, CatalogFilterValue> {
    return MOCK_CATALOG_FILTER;
  }

  async calculateMetrics(_entity: Entity): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    for (const config of this.metricConfigs) {
      results.set(`${this.providerIdPrefix}.${config.id}`, true);
    }
    return results;
  }
}

export const filecheckBatchProvider = new MockBatchBooleanProvider(
  'filecheck',
  'filecheck',
  [
    { id: 'readme', path: 'README.md' },
    { id: 'license', path: 'LICENSE' },
    { id: 'codeowners', path: 'CODEOWNERS' },
  ],
);

export const filecheckBatchMetrics = [
  {
    id: 'filecheck.readme',
    title: 'File: README.md',
    description: 'Checks if README.md exists.',
    type: 'boolean' as const,
    thresholds: BOOLEAN_THRESHOLDS,
  },
  {
    id: 'filecheck.license',
    title: 'File: LICENSE',
    description: 'Checks if LICENSE exists.',
    type: 'boolean' as const,
    thresholds: BOOLEAN_THRESHOLDS,
  },
  {
    id: 'filecheck.codeowners',
    title: 'File: CODEOWNERS',
    description: 'Checks if CODEOWNERS exists.',
    type: 'boolean' as const,
    thresholds: BOOLEAN_THRESHOLDS,
  },
];
