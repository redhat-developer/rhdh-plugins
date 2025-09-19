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
  MetricProvider,
  MetricProviderConnection,
  MetricProviderInsertion,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

import { ProviderStore } from '../database/ProviderStore';

export class Connection implements MetricProviderConnection {
  constructor(private readonly providerStore: ProviderStore) {}

  async insertMetrics(metrics: MetricProviderInsertion[]): Promise<void> {
    await this.providerStore.createMetricValues(metrics);
  }
}

export async function connectMetricProviders(
  providers: MetricProvider[],
  providerStore: ProviderStore,
) {
  await Promise.all(
    providers.map(async provider => {
      try {
        const connection = new Connection(providerStore);
        return provider.connect(connection);
      } catch (error) {
        throw new Error(
          `Unable to connect provider ${provider.getProviderId()}, ${error}`,
        );
      }
    }),
  );
}
