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
  createApiRef,
  DiscoveryApi,
  FetchApi,
} from '@backstage/core-plugin-api';
import type { DefaultCardsResponse } from '@red-hat-developer-hub/backstage-plugin-homepage-common';

export type { DefaultCardsResponse };
export type {
  CardLayout,
  VisibleCard,
} from '@red-hat-developer-hub/backstage-plugin-homepage-common';

export interface DefaultCardsApi {
  getDefaultCards(): Promise<DefaultCardsResponse>;
}

export const defaultCardsApiRef = createApiRef<DefaultCardsApi>({
  id: 'plugin.homepage.default-cards',
});

export class DefaultCardsApiClient implements DefaultCardsApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  async getDefaultCards(): Promise<DefaultCardsResponse> {
    const baseUrl = await this.discoveryApi.getBaseUrl('homepage');
    const response = await this.fetchApi.fetch(`${baseUrl}/default-cards`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch default cards, status ${response.status}: ${response.statusText}`,
      );
    }
    return await response.json();
  }
}
