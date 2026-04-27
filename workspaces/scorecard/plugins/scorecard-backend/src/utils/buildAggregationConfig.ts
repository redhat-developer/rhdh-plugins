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
  type ThresholdConfig,
  aggregationKinds,
  type AggregationConfigOptions,
  type AggregationConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

function buildStatusScores(
  config: Config,
): AggregationConfigOptions['statusScores'] {
  const statusScores: AggregationConfigOptions['statusScores'] = {};
  const statusScoresConfig = config
    .getConfig('options')
    .getConfig('statusScores');

  for (const key of statusScoresConfig.keys()) {
    statusScores[key] = statusScoresConfig.getNumber(key);
  }

  return statusScores;
}

function buildAggregationThresholdsConfig(
  config: Config,
): ThresholdConfig | undefined {
  const aggregationResultThresholds = config.getOptionalConfig(
    'options.aggregationResultThresholds',
  );
  if (aggregationResultThresholds) {
    return {
      rules: aggregationResultThresholds.getConfigArray('rules').map(rule => ({
        key: rule.getString('key'),
        expression: rule.getString('expression'),
        color: rule.getString('color'),
      })),
    };
  }

  return undefined;
}

export function buildAggregationConfig(
  aggregationId: string,
  options: {
    config: Config;
  },
): AggregationConfig {
  const { config } = options;

  const aggregationConfig: AggregationConfig = {
    id: aggregationId,
    type: config.getString('type'),
    title: config.getString('title'),
    metricId: config.getString('metricId'),
    description: config.getString('description'),
  } as AggregationConfig;

  if (aggregationConfig.type === aggregationKinds.average) {
    aggregationConfig.options = {
      statusScores: buildStatusScores(config),
      aggregationResultThresholds: buildAggregationThresholdsConfig(config),
    };
  }

  return aggregationConfig;
}
