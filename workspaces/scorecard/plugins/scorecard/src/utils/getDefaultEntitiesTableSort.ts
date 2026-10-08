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
  aggregationTypes,
  type AggregationType,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

export type EntitiesTableSortState = {
  orderBy: string | null;
  order: 'asc' | 'desc';
};

export const DEFAULT_ENTITIES_TABLE_SORT: EntitiesTableSortState = {
  orderBy: null,
  order: 'asc',
};

/**
 * Default entities-table sort for scalar aggregation drill-down.
 * Min KPIs surface the portfolio floor (ascending value);
 * max KPIs surface the portfolio peak (descending value).
 */
export function getDefaultEntitiesTableSort(
  aggregationType?: AggregationType,
): EntitiesTableSortState {
  switch (aggregationType) {
    case aggregationTypes.min:
      return { orderBy: 'metricValue', order: 'asc' };
    case aggregationTypes.max:
      return { orderBy: 'metricValue', order: 'desc' };
    default:
      return DEFAULT_ENTITIES_TABLE_SORT;
  }
}
