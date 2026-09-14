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

import { aggregationTypes } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import {
  DEFAULT_ENTITIES_TABLE_SORT,
  getDefaultEntitiesTableSort,
} from '../getDefaultEntitiesTableSort';

describe('getDefaultEntitiesTableSort', () => {
  it('should sort min aggregations by metric value ascending', () => {
    expect(getDefaultEntitiesTableSort(aggregationTypes.min)).toEqual({
      orderBy: 'metricValue',
      order: 'asc',
    });
  });

  it('should sort max aggregations by metric value descending', () => {
    expect(getDefaultEntitiesTableSort(aggregationTypes.max)).toEqual({
      orderBy: 'metricValue',
      order: 'desc',
    });
  });

  it('should keep the legacy default for other aggregation types', () => {
    expect(getDefaultEntitiesTableSort(aggregationTypes.sum)).toBe(
      DEFAULT_ENTITIES_TABLE_SORT,
    );
    expect(getDefaultEntitiesTableSort(aggregationTypes.average)).toBe(
      DEFAULT_ENTITIES_TABLE_SORT,
    );
    expect(getDefaultEntitiesTableSort(aggregationTypes.statusGrouped)).toBe(
      DEFAULT_ENTITIES_TABLE_SORT,
    );
    expect(getDefaultEntitiesTableSort()).toBe(DEFAULT_ENTITIES_TABLE_SORT);
  });
});
