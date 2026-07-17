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

import type { Config } from '@backstage/config';
import {
  aggregationTypes,
  type AggregationConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { isScalarAggregationType } from './isScalarAggregationType';
import { buildAggregationConfigThresholds } from './buildAggregationConfigThresholds';
import { buildAggregationStatusScores } from './buildAggregationStatusScores';

type Options = {
  config: Config;
};

export function buildAggregationConfig(
  aggregationId: string,
  options: Options,
): AggregationConfig {
  const { config } = options;

  const aggregationConfig: AggregationConfig = {
    id: aggregationId,
    type: config.getString('type'),
    title: config.getString('title'),
    metricId: config.getString('metricId'),
    description: config.getString('description'),
  } as AggregationConfig;

  aggregationConfig.options = {};

  if (aggregationConfig.type === aggregationTypes.weightedStatusScore) {
    aggregationConfig.options.statusScores =
      buildAggregationStatusScores(config);
    aggregationConfig.options.thresholds =
      buildAggregationConfigThresholds(config);
  } else if (isScalarAggregationType(aggregationConfig.type)) {
    aggregationConfig.options.thresholds =
      buildAggregationConfigThresholds(config);
  }

  return aggregationConfig;
}
