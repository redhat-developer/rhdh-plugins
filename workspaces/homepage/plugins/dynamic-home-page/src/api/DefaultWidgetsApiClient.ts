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
import type { DefaultWidgetsResponse } from '@red-hat-developer-hub/backstage-plugin-homepage-common';

export type { DefaultWidgetsResponse };
export type {
  CardLayout,
  VisibleCard,
} from '@red-hat-developer-hub/backstage-plugin-homepage-common';

export interface DefaultWidgetsApi {
  getDefaultWidgets(): Promise<DefaultWidgetsResponse>;
}

export const defaultWidgetsApiRef = createApiRef<DefaultWidgetsApi>({
  id: 'plugin.homepage.default-widgets',
});

export class DefaultWidgetsApiClient implements DefaultWidgetsApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  async getDefaultWidgets(): Promise<DefaultWidgetsResponse> {
    const baseUrl = await this.discoveryApi.getBaseUrl('homepage');
    const response = await this.fetchApi.fetch(`${baseUrl}/default-widgets`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch default cards, status ${response.status}: ${response.statusText}`,
      );
    }
    return await response.json();
  }
}
