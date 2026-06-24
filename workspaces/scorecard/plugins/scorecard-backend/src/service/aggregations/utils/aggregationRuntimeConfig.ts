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

import { scalarAggregationTypes } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import type {
  ScalarAggregationConfig,
  ValidatedAggregationConfig,
} from '../../../validation/schemas/aggregationConfigSchemas';
import type { AggregationRuntimeConfig } from '../types';

export function isValidatedAggregationConfig(
  config: AggregationRuntimeConfig,
): config is ValidatedAggregationConfig {
  return 'title' in config;
}

export function isScalarAggregationRuntimeConfig(
  config: AggregationRuntimeConfig,
): config is ScalarAggregationConfig {
  return (
    isValidatedAggregationConfig(config) &&
    (scalarAggregationTypes as readonly string[]).includes(config.type)
  );
}
