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
import { Metric } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  MetricProvider,
  ThresholdConfigFormatError,
  validateThresholdsForMetric,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import {
  validateMetricId,
  validateProviderId,
} from '../validation/validateMetricProviderIds';

/**
 * Registry of all registered metric providers.
 */
export class MetricProvidersRegistry {
  /** metricId → provider (a multi-metric provider is stored under each of its metric IDs) */
  private readonly metricProviders = new Map<string, MetricProvider>();
  /** datasourceId → set of metricIds for that datasource */
  private readonly datasourceIndex = new Map<string, Set<string>>();
  /** Registered provider IDs (unique; used for scheduler task / config keys) */
  private readonly registeredProviderIds = new Set<string>();

  register(metricProvider: MetricProvider): void {
    const providerDatasource = metricProvider.getProviderDatasourceId();
    const providerId = metricProvider.getProviderId();

    validateProviderId(providerId, providerDatasource);

    if (this.registeredProviderIds.has(providerId)) {
      throw new ConflictError(
        `Metric provider with ID '${providerId}' has already been registered`,
      );
    }

    const metrics = metricProvider.getMetrics();
    const metricIds = metrics.map(m => m.id);

    for (const metric of metrics) {
      const metricId = metric.id;

      validateMetricId(metricId, providerDatasource);

      if (this.metricProviders.has(metricId)) {
        throw new ConflictError(
          `Metric with ID '${metricId}' has already been registered`,
        );
      }

      try {
        validateThresholdsForMetric(metric.thresholds, metric.type);
      } catch (error) {
        throw new ThresholdConfigFormatError(
          `Invalid default thresholds for metric provider '${providerId}', metric '${metricId}'`,
          error,
        );
      }
    }

    this.registeredProviderIds.add(providerId);

    for (const metricId of metricIds) {
      this.metricProviders.set(metricId, metricProvider);

      // Index by datasource
      let datasourceMetricIds = this.datasourceIndex.get(providerDatasource);
      if (!datasourceMetricIds) {
        datasourceMetricIds = new Set();
        this.datasourceIndex.set(providerDatasource, datasourceMetricIds);
      }
      datasourceMetricIds.add(metricId);
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
