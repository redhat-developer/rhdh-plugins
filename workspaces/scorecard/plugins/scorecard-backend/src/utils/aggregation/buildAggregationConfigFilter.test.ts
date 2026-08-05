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

import { mockServices } from '@backstage/backend-test-utils';
import { aggregationTypes } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { AGGREGATION_KPIS_CONFIG_PATH } from '../../constants';
import { buildAggregationConfigFilter } from './buildAggregationConfigFilter';

describe('buildAggregationConfigFilter', () => {
  it('should return undefined when filter is absent', () => {
    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            totalOpenPrsKpi: {
              title: 'Total Open PRs',
              description: 'Sum of open PRs',
              type: aggregationTypes.sum,
              metricId: 'github.openPRs',
            },
          },
        },
      },
    });
    const config = rootConfig.getConfig(
      `${AGGREGATION_KPIS_CONFIG_PATH}.totalOpenPrsKpi`,
    );

    expect(buildAggregationConfigFilter(config)).toBeUndefined();
  });

  it('should return undefined when filter has no properties', () => {
    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            totalOpenPrsKpi: {
              title: 'Total Open PRs',
              description: 'Sum of open PRs',
              type: aggregationTypes.sum,
              metricId: 'github.openPRs',
              filter: {},
            },
          },
        },
      },
    });
    const config = rootConfig.getConfig(
      `${AGGREGATION_KPIS_CONFIG_PATH}.totalOpenPrsKpi`,
    );

    expect(buildAggregationConfigFilter(config)).toBeUndefined();
  });

  it('should map filter.status from KPI config', () => {
    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            totalCriticalPrs: {
              title: 'Total Critical PRs',
              description: 'Sum of open PRs for entities in error status',
              type: aggregationTypes.sum,
              metricId: 'github.openPRs',
              filter: {
                status: 'error',
              },
            },
          },
        },
      },
    });
    const config = rootConfig.getConfig(
      `${AGGREGATION_KPIS_CONFIG_PATH}.totalCriticalPrs`,
    );

    expect(buildAggregationConfigFilter(config)).toEqual({ status: 'error' });
  });
});
