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
import { AggregationType } from 'plugins/scorecard-common/src/types/aggregation';

export type AggregationConfig = {
  id: string;
  title: string;
  description: string;
  type: AggregationType;
  metricId: string;
};

export function buildAggregationConfig(
  aggregationId: string,
  options: {
    config: Config;
  },
): AggregationConfig {
  const { config } = options;

  return {
    id: aggregationId,
    type: config.getString('type'),
    title: config.getString('title'),
    metricId: config.getString('metricId'),
    description: config.getString('description'),
  } as AggregationConfig;
}
