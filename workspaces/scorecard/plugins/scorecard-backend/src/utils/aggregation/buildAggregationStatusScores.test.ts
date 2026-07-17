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
import { ConfigReader } from '@backstage/config';
import { aggregationTypes } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { AGGREGATION_KPIS_CONFIG_PATH } from '../../constants';
import { buildAggregationStatusScores } from './buildAggregationStatusScores';

describe('buildAggregationStatusScores', () => {
  it('should map statusScores from KPI config', () => {
    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            weightedKpi: {
              title: 'Weighted health',
              description: 'Weighted health score across statuses',
              type: aggregationTypes.weightedStatusScore,
              metricId: 'github.open_prs',
              options: {
                statusScores: {
                  error: 0,
                  warning: 50,
                  success: 100,
                },
              },
            },
          },
        },
      },
    });
    const config = rootConfig.getConfig(
      `${AGGREGATION_KPIS_CONFIG_PATH}.weightedKpi`,
    );

    expect(buildAggregationStatusScores(config)).toEqual({
      error: 0,
      warning: 50,
      success: 100,
    });
  });

  it('should map a single status score entry', () => {
    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            weightedKpi: {
              title: 'Weighted health',
              description: 'Weighted health score',
              type: aggregationTypes.weightedStatusScore,
              metricId: 'github.open_prs',
              options: {
                statusScores: {
                  success: 100,
                },
              },
            },
          },
        },
      },
    });
    const config = rootConfig.getConfig(
      `${AGGREGATION_KPIS_CONFIG_PATH}.weightedKpi`,
    );

    expect(buildAggregationStatusScores(config)).toEqual({
      success: 100,
    });
  });

  it('should throw when options is missing', () => {
    const config = new ConfigReader({
      title: 'Weighted health',
      description: 'Weighted health score',
      type: aggregationTypes.weightedStatusScore,
      metricId: 'github.open_prs',
    });

    expect(() => buildAggregationStatusScores(config)).toThrow(
      /Missing required config value at 'options'/,
    );
  });

  it('should throw when options.statusScores is missing', () => {
    const config = new ConfigReader({
      title: 'Weighted health',
      description: 'Weighted health score',
      type: aggregationTypes.weightedStatusScore,
      metricId: 'github.open_prs',
      options: {},
    });

    expect(() => buildAggregationStatusScores(config)).toThrow(
      /Missing required config value at 'options\.statusScores'/,
    );
  });
});
