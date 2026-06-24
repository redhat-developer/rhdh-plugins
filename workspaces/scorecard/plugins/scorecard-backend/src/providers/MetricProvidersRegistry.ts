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

import type { Entity } from '@backstage/catalog-model';
import { ConflictError, NotFoundError } from '@backstage/errors';
import {
  Metric,
  MetricValue,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  MetricProvider,
  ThresholdConfigFormatError,
  validateThresholdsForMetric,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

/**
 * Registry of all registered metric providers.
 */
export class MetricProvidersRegistry {
  private readonly metricProviders = new Map<string, MetricProvider>();
  private readonly datasourceIndex = new Map<string, Set<string>>();

  register(metricProvider: MetricProvider): void {
    const providerDatasource = metricProvider.getProviderDatasourceId();
    const providerId = metricProvider.getProviderId();

    const metrics = metricProvider.getMetrics();
    const metricIds = metrics.map(m => m.id);

    for (const metric of metrics) {
      const metricId = metric.id;

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

      try {
        validateThresholdsForMetric(metric.threshold, metric.type);
      } catch (error) {
        throw new ThresholdConfigFormatError(
          `Invalid default thresholds for metric provider '${providerId}', metric '${metricId}'`,
          error,
        );
      }
    }

    for (const metricId of metricIds) {
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
    const metrics = provider.getMetrics();
    const metric = metrics.find(m => m.id === metricId);
    if (metric) {
      return metric;
    }

    throw new NotFoundError(
      `Metric '${metricId}' not found in provider '${provider.getProviderId()}'`,
    );
  }

  async calculateMetric(
    metricId: string,
    entity: Entity,
  ): Promise<MetricValue> {
    const provider = this.getProvider(metricId);
    const results = await provider.calculateMetrics(entity);
    const value = results.get(metricId);
    if (value === undefined) {
      throw new Error(
        `Provider '${provider.getProviderId()}' did not return a value for metric '${metricId}'`,
      );
    }
    return value;
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

          const metrics = provider.getMetrics();
          return metrics.find(m => m.id === metricId);
        })
        .filter((m): m is Metric => m !== undefined);
    }

    // List all metrics from all providers (deduplicate batch providers)
    return this.listProviders().flatMap(provider => provider.getMetrics());
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

    return [...new Set(providers)].flatMap(provider => provider.getMetrics());
  }
}
