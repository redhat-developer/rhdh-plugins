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
    const providerId = metricProvider.getProviderId();
    const providerDatasource = metricProvider.getProviderDatasourceId();
    const metricId = metricProvider.getMetric().id;

    if (providerId !== metricId) {
      throw new Error(
        `Invalid metric provider with ID ${providerId}, provider ID must match metric ID '${metricId}'`,
      );
    }

    const expectedPrefix = `${providerDatasource}.`;
    if (
      !providerId.startsWith(expectedPrefix) ||
      providerId === expectedPrefix
    ) {
      throw new Error(
        `Invalid metric provider with ID ${providerId}, must have format '${providerDatasource}.<metric_name>' where metric name is not empty`,
      );
    }

    if (this.metricProviders.has(providerId)) {
      throw new ConflictError(
        `Metric provider with ID '${providerId}' has already been registered`,
      );
    }

    this.metricProviders.set(providerId, metricProvider);
    let datasourceProviders = this.datasourceIndex.get(providerDatasource);
    if (!datasourceProviders) {
      datasourceProviders = new Set();
      this.datasourceIndex.set(providerDatasource, datasourceProviders);
    }
    datasourceProviders.add(providerId);
  }

  getProvider(providerId: string): MetricProvider {
    const metricProvider = this.metricProviders.get(providerId);
    if (!metricProvider) {
      throw new NotFoundError(
        `Metric provider with ID '${providerId}' is not registered.`,
      );
    }
    return metricProvider;
  }

  getMetric(providerId: string): Metric {
    return this.getProvider(providerId).getMetric();
  }

  async calculateMetric(
    providerId: string,
    entity: Entity,
  ): Promise<MetricValue> {
    return this.getProvider(providerId).calculateMetric(entity);
  }

  async calculateMetrics(
    providerIds: string[],
    entity: Entity,
  ): Promise<{ providerId: string; value?: MetricValue; error?: Error }[]> {
    const results = await Promise.allSettled(
      providerIds.map(providerId => this.calculateMetric(providerId, entity)),
    );

    return results.map((result, index) => {
      const providerId = providerIds[index];
      if (result.status === 'fulfilled') {
        return { providerId, value: result.value };
      }
      return { providerId, error: result.reason as Error };
    });
  }

  listProviders(): MetricProvider[] {
    return Array.from(this.metricProviders.values());
  }

  listMetrics(providerIds?: string[]): Metric[] {
    if (providerIds && providerIds.length !== 0) {
      return providerIds
        .map(providerId => this.metricProviders.get(providerId)?.getMetric())
        .filter((m): m is Metric => m !== undefined);
    }
    return [...this.metricProviders.values()].map(provider =>
      provider.getMetric(),
    );
  }

  listMetricsByDatasource(datasourceId: string): Metric[] {
    const providerIdsOfDatasource = this.datasourceIndex.get(datasourceId);
    if (!providerIdsOfDatasource) {
      return [];
    }

    return Array.from(providerIdsOfDatasource)
      .map(providerId => this.metricProviders.get(providerId))
      .filter((provider): provider is MetricProvider => provider !== undefined)
      .map(provider => provider.getMetric());
  }
}
