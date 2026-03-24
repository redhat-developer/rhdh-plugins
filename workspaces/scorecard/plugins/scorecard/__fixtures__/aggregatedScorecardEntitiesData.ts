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

import { subMinutes, subHours, subDays } from 'date-fns';

export const mockAggregatedScorecardEntitiesData = (
  metricId: string,
  page: number,
  pageSize: number,
) => {
  const now = new Date();

  return {
    metricId,
    metricMetadata: {
      title: 'Example Metric',
      description: 'Example Metric Description',
      type: 'number',
    },
    entities: [
      // 1 minute ago
      {
        entityRef: 'component:default/service-one-minute',
        entityName: 'service-one-minute',
        entityNamespace: 'default',
        entityKind: 'Component',
        owner: 'group:default/platform',
        metricValue: 5,
        timestamp: now.toISOString(),
        status: 'success',
      },

      // 15 minutes ago
      {
        entityRef: 'component:default/service-fifteen-minutes',
        entityName: 'service-fifteen-minutes',
        entityNamespace: 'default',
        entityKind: 'Component',
        owner: 'group:default/platform',
        metricValue: 10,
        timestamp: subMinutes(now, 15).toISOString(),
        status: 'success',
      },

      // 1 hour ago
      {
        entityRef: 'component:default/service-one-hour',
        entityName: 'service-one-hour',
        entityNamespace: 'default',
        entityKind: 'Component',
        owner: 'group:default/platform',
        metricValue: 30,
        timestamp: subHours(now, 1).toISOString(),
        status: 'warning',
      },

      // 5 hours ago
      {
        entityRef: 'component:default/service-five-hours',
        entityName: 'service-five-hours',
        entityNamespace: 'default',
        entityKind: 'Component',
        owner: 'group:default/platform',
        metricValue: 50,
        timestamp: subHours(now, 5).toISOString(),
        status: 'error',
      },

      // Yesterday
      {
        entityRef: 'component:default/service-yesterday',
        entityName: 'service-yesterday',
        entityNamespace: 'default',
        entityKind: 'Component',
        owner: 'group:default/platform',
        metricValue: 30,
        timestamp: subDays(now, 1).toISOString(),
        status: 'error',
      },

      // 3 days ago
      {
        entityRef: 'component:default/service-three-days',
        entityName: 'service-three-days',
        entityNamespace: 'default',
        entityKind: 'Component',
        owner: 'group:default/platform',
        metricValue: 40,
        timestamp: subDays(now, 3).toISOString(),
        status: 'success',
      },

      // 7+ days ago → formatted date
      {
        entityRef: 'component:default/service-old',
        entityName: 'service-old',
        entityNamespace: 'default',
        entityKind: 'Component',
        owner: 'group:default/platform',
        metricValue: 50,
        timestamp: subDays(now, 10).toISOString(),
        status: 'error',
      },

      // Invalid timestamp
      {
        entityRef: 'component:default/service-invalid',
        entityName: 'service-invalid',
        entityNamespace: 'default',
        entityKind: 'Component',
        owner: 'group:default/platform',
        metricValue: 0,
        timestamp: 'invalid-date',
        status: 'error',
      },
    ],
    pagination: {
      page,
      pageSize,
      total: 8,
      totalPages: 1,
      isCapped: false,
    },
  };
};
