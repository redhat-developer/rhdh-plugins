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
import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import {
  AggregationsRequest,
  MarketplaceAggregationApi,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

export type MarketplaceAggregationBackendClientOptions = {
  discoveryApi: DiscoveryApi;
  fetchApi: FetchApi;
};

export class MarketplaceAggregationBackendClient
  implements MarketplaceAggregationApi
{
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: MarketplaceAggregationBackendClientOptions) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  async fetchAggregatedData(
    aggregationsRequest: AggregationsRequest,
  ): Promise<Record<string, any>[]> {
    const baseUrl = await this.discoveryApi.getBaseUrl('marketplace');
    const url = `${baseUrl}/aggregations`;

    const response = await this.fetchApi.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aggregationsRequest),
    });
    if (!response.ok) {
      throw new Error(
        `Unexpected status code: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }
}
