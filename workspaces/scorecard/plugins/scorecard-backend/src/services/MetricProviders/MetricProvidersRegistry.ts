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
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

/**
 * Registry of all registered metric providers.
 * @public
 */
export class MetricProvidersRegistry {
  private readonly metricProviders = new Map<string, MetricProvider>();
  private readonly datasourceIndex = new Map<string, Set<string>>();

  register(metricProvider: MetricProvider): void {
    const providerId = metricProvider.getProviderId();
    const providerDatasource = metricProvider.getProviderDatasourceId();

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

  private getProvider(providerId: string): MetricProvider {
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
  ): Promise<number | boolean | string> {
    return this.getProvider(providerId).calculateMetric();
  }

  listMetrics(): Metric[] {
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
