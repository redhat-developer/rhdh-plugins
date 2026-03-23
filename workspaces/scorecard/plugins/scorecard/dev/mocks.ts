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
import type {
  MetricResult,
  AggregatedMetricResult,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import {
  mockScorecardErrorData,
  mockScorecardSuccessData,
} from '../__fixtures__/scorecardData';
import { mockAggregatedScorecardSuccessData } from '../__fixtures__/aggregatedScorecardData';

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

export class MockScorecardApi {
  async getScorecards(_entity: Entity): Promise<MetricResult[]> {
    return [...mockScorecardSuccessData, ...mockScorecardErrorData];
  }
  async getAggregatedScorecard(
    _metricId: string,
  ): Promise<AggregatedMetricResult> {
    return mockAggregatedScorecardSuccessData;
  }
}
