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

import type { AggregatedMetric } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { DatabaseMetricValues } from '../../database/DatabaseMetricValues';
import { AggregatedMetricMapper } from '../mappers';

export class AggregatedMetricLoader {
  constructor(private readonly database: DatabaseMetricValues) {}

  async loadStatusGroupedMetricByEntityRefs(
    entityRefs: string[],
    metricId: string,
  ): Promise<AggregatedMetric> {
    if (entityRefs.length === 0) {
      return AggregatedMetricMapper.toAggregatedMetric();
    }

    const aggregatedMetric =
      await this.database.readAggregatedMetricByEntityRefs(
        entityRefs,
        metricId,
      );

    return AggregatedMetricMapper.toAggregatedMetric(aggregatedMetric);
  }
}
