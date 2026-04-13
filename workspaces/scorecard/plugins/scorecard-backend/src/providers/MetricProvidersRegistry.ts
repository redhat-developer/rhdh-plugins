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

import { ConflictError, NotFoundError } from '@backstage/errors';
import {
  Metric,
  MetricValue,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import type { Entity } from '@backstage/catalog-model';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

/**
 * Registry of all registered metric providers.
 */
export class MetricProvidersRegistry {
  private readonly metricProviders = new Map<string, MetricProvider>();
  private readonly datasourceIndex = new Map<string, Set<string>>();

  register(metricProvider: MetricProvider): void {
    const providerDatasource = metricProvider.getProviderDatasourceId();
    const metricType = metricProvider.getMetricType();

    // Support both single and batch providers
    const metricIds = metricProvider.getMetricIds?.() ?? [
      metricProvider.getProviderId(),
    ];
    const metrics = metricProvider.getMetrics?.() ?? [
      metricProvider.getMetric(),
    ];

    // Validate: Each metric ID must have a corresponding metric definition
    for (const metricId of metricIds) {
      const metric = metrics.find(m => m.id === metricId);
      if (!metric) {
        throw new Error(
          `Invalid metric provider: metric ID '${metricId}' returned by getMetricIds() ` +
            `does not have a corresponding metric in getMetrics()`,
        );
      }

      if (metricType !== metric.type) {
        throw new Error(
          `Invalid metric provider with ID ${metricId}, getMetricType() must match ` +
            `getMetric().type. Expected '${metricType}', but got '${metric.type}'`,
        );
      }

      // Validate: Provider ID format (datasource.metric_name)
      const expectedPrefix = `${providerDatasource}.`;
      if (!metricId.startsWith(expectedPrefix) || metricId === expectedPrefix) {
        throw new Error(
          `Invalid metric provider with ID ${metricId}, must have format ` +
            `'${providerDatasource}.<metric_name>' where metric name is not empty`,
        );
      }

      if (this.metricProviders.has(metricId)) {
        throw new ConflictError(
          `Metric provider with ID '${metricId}' has already been registered`,
        );
      }

      this.metricProviders.set(metricId, metricProvider);

      // Index by datasource
      let datasourceProviders = this.datasourceIndex.get(providerDatasource);
      if (!datasourceProviders) {
        datasourceProviders = new Set();
        this.datasourceIndex.set(providerDatasource, datasourceProviders);
      }
      datasourceProviders.add(metricId);
    }
  }

  getProvider(metricId: string): MetricProvider {
    const metricProvider = this.metricProviders.get(metricId);
    if (!metricProvider) {
      throw new NotFoundError(
        `No metric provider registered for metric ID '${metricId}'.`,
      );
    }
    return metricProvider;
  }

  hasProvider(providerId: string): boolean {
    return this.metricProviders.has(providerId);
  }

  getMetric(metricId: string): Metric {
    const provider = this.getProvider(metricId);

    // For batch providers, find the specific metric by ID
    if (provider.getMetrics) {
      const metrics = provider.getMetrics();
      const metric = metrics.find(m => m.id === metricId);
      if (metric) {
        return metric;
      }
    }

    return provider.getMetric();
  }

  async calculateMetric(
    metricId: string,
    entity: Entity,
  ): Promise<MetricValue> {
    return this.getProvider(metricId).calculateMetric(entity);
  }

  async calculateMetrics(
    metricIds: string[],
    entity: Entity,
  ): Promise<{ metricId: string; value?: MetricValue; error?: Error }[]> {
    const results = await Promise.allSettled(
      metricIds.map(metricId => this.calculateMetric(metricId, entity)),
    );

    return results.map((result, index) => {
      const metricId = metricIds[index];
      if (result.status === 'fulfilled') {
        return { metricId, value: result.value };
      }
      return { metricId, error: result.reason as Error };
    });
  }

  listProviders(): MetricProvider[] {
    // Deduplicate providers since batch providers are stored under multiple metric IDs
    return [...new Set(this.metricProviders.values())];
  }

  listMetrics(metricIds?: string[]): Metric[] {
    if (metricIds && metricIds.length !== 0) {
      return metricIds
        .map(metricId => {
          const provider = this.metricProviders.get(metricId);
          if (!provider) return undefined;

          if (provider.getMetrics) {
            const metrics = provider.getMetrics();
            return metrics.find(m => m.id === metricId);
          }

          return provider.getMetric();
        })
        .filter((m): m is Metric => m !== undefined);
    }

    // List all metrics from all providers (deduplicate batch providers)
    return this.listProviders().flatMap(
      provider => provider.getMetrics?.() ?? [provider.getMetric()],
    );
  }

  listMetricsByDatasource(datasourceId: string): Metric[] {
    const providerIdsOfDatasource = this.datasourceIndex.get(datasourceId);

    if (!providerIdsOfDatasource) {
      return [];
    }

    // Get unique providers for this datasource, then get their metrics
    const providers = [...providerIdsOfDatasource]
      .map(id => this.metricProviders.get(id))
      .filter((p): p is MetricProvider => p !== undefined);

    return [...new Set(providers)].flatMap(
      provider => provider.getMetrics?.() ?? [provider.getMetric()],
    );
  }
}
