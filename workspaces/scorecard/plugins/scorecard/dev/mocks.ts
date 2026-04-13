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

import { InMemoryCatalogClient } from '@backstage/catalog-client/testUtils';
import type { Entity } from '@backstage/catalog-model';
import {
  type MetricResult,
  type AggregatedMetricResult,
  type Metric,
  type EntityMetricDetailResponse,
  type AggregationMetadata,
  aggregationTypes,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import type { GetAggregatedScorecardEntitiesOptions } from '../src/components/types';

import {
  mockAggregatedScorecardData,
  mockScorecardErrorData,
  mockScorecardSuccessData,
} from '../__fixtures__/scorecardData';
import { mockAggregatedScorecardEntitiesData } from '../__fixtures__/aggregatedScorecardEntitiesData';
import { ScorecardApi, ScorecardOptions } from '../src/api/types';

/** mock catalog entity so the Catalog shows one entity and the Scorecard tab can be opened. */
export const mockComponentEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    namespace: 'default',
    name: 'example-service',
    description: 'Example service',
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
  },
};

export const mockCatalogApi = new InMemoryCatalogClient({
  entities: [mockComponentEntity],
});

export class MockScorecardApi implements ScorecardApi {
  async getBaseUrl(): Promise<string> {
    return 'https://example.com';
  }

  async getScorecards(_options: ScorecardOptions): Promise<MetricResult[]> {
    return [...mockScorecardSuccessData, ...mockScorecardErrorData];
  }

  async getAggregatedScorecard(
    _aggregationId: string,
  ): Promise<AggregatedMetricResult> {
    return mockAggregatedScorecardData[aggregationTypes.statusGrouped];
  }

  async getMetrics(_options: {
    metricIds: string[];
  }): Promise<{ metrics: Metric[] }> {
    const allMetrics = [
      ...mockScorecardSuccessData,
      ...mockScorecardErrorData,
    ].map(m => ({
      id: m.id,
      title: m.metadata.title,
      description: m.metadata.description,
      type: m.metadata.type,
      history: m.metadata.history,
    }));
    return { metrics: allMetrics };
  }

  async getAggregatedScorecardEntities(
    options: GetAggregatedScorecardEntitiesOptions,
  ): Promise<EntityMetricDetailResponse> {
    return mockAggregatedScorecardEntitiesData(
      options.metricId,
      options.page ?? 1,
      options.pageSize ?? 10,
    ) as EntityMetricDetailResponse;
  }

  async getAggregationMetadata(
    _aggregationId: string,
  ): Promise<AggregationMetadata> {
    return {
      title: 'GitHub open issues',
      description: 'GitHub open issues',
      type: 'number',
      history: true,
      aggregationType: aggregationTypes.statusGrouped,
    };
  }
}
