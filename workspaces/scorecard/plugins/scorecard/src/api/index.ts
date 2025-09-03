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

import { ConfigApi, createApiRef, FetchApi } from '@backstage/core-plugin-api';
import type { Entity } from '@backstage/catalog-model';
import type { MetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

export interface ScorecardApi {
  /**
   * Retrieves scorecard metrics for a specific entity.
   * @param entity - The Backstage entity to get metrics for
   * @param metricIds - Optional array of specific metric IDs to retrieve
   * @returns Promise resolving to an array of metric results
   */
  getScorecards(entity: Entity, metricIds?: string[]): Promise<MetricResult[]>;
}

export const scorecardApiRef = createApiRef<ScorecardApi>({
  id: 'plugin.scorecard.service',
});

export type ScorecardApiClientOptions = {
  configApi: ConfigApi;
  fetchApi: FetchApi;
};

/**
 * Client implementation for the Scorecard API.
 * @public
 */
export class ScorecardApiClient implements ScorecardApi {
  private readonly configApi: ConfigApi;
  private readonly fetchApi: FetchApi;

  constructor(options: ScorecardApiClientOptions) {
    this.configApi = options.configApi;
    this.fetchApi = options.fetchApi;
  }

  /**
   * Gets the base URL for the scorecard backend API.
   * @returns Promise resolving to the base URL
   */
  async getBaseUrl(): Promise<string> {
    return `${this.configApi.getString('backend.baseUrl')}/api/scorecard`;
  }

  /**
   * Retrieves scorecard metrics for a specific entity.
   * @param entity - The Backstage entity to get metrics for
   * @param metricIds - Optional array of specific metric IDs to retrieve
   * @returns Promise resolving to an array of metric results
   * @throws Error if the request fails or returns invalid data
   */
  async getScorecards(
    entity: Entity,
    metricIds?: string[],
  ): Promise<MetricResult[]> {
    if (
      !entity?.kind ||
      !entity?.metadata?.namespace ||
      !entity?.metadata?.name
    ) {
      throw new Error(
        'Entity missing required properties for scorecard lookup',
      );
    }

    const baseUrl = await this.getBaseUrl();
    const url = new URL(
      `${baseUrl}/metrics/catalog/${entity.kind}/${entity.metadata.namespace}/${entity.metadata.name}`,
    );

    if (metricIds) {
      url.searchParams.set('metricIds', metricIds.join(','));
    }

    try {
      const response = await this.fetchApi.fetch(url.toString());

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch scorecards: ${response.status} ${response.statusText}. ${errorText}`,
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from scorecard API');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Unexpected error fetching scorecards: ${String(error)}`);
    }
  }
}
