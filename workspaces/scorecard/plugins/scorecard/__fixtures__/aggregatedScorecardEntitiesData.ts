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

export const mockAggregatedScorecardEntitiesData = (
  metricId: string,
  page: number,
  pageSize: number,
) => {
  return {
    metricId,
    metricMetadata: {
      title: 'Example Metric',
      description: 'Example Metric Description',
      type: 'number',
    },
    entities: [
      {
        entityRef: 'component:default/example-service',
        entityName: 'example-service',
        entityNamespace: 'default',
        entityKind: 'Component',
        owner: 'group:default/platform',
        metricValue: 10,
        timestamp: '2025-01-01T10:00:00.000Z',
        status: 'success',
      },
      {
        entityRef: 'component:default/example-service-2',
        entityName: 'example-service-2',
        entityNamespace: 'default',
        entityKind: 'Component',
        owner: 'group:default/platform',
        metricValue: 20,
        timestamp: '2025-01-01T10:00:00.000Z',
        status: 'error',
      },
    ],
    pagination: {
      page: page,
      pageSize: pageSize,
      total: 2,
      totalPages: 1,
      isCapped: false,
    },
  };
};
