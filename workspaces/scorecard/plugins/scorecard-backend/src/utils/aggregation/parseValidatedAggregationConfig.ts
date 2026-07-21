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

import { InputError } from '@backstage/errors';
import { aggregationConfigSchema } from '../../validation/schemas/aggregationConfigSchemas';
import type { ValidatedAggregationConfig } from '../../validation/schemas/aggregationConfigSchemas';
import { aggregationTypes } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { validateThresholdsForAggregation } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

export function parseValidatedAggregationConfig(
  config: unknown,
): ValidatedAggregationConfig {
  const parsed = aggregationConfigSchema.safeParse(config);

  if (!parsed.success) {
    const errorMessage = parsed.error.errors
      .map(error => `${error.message} for attribute "${error.path.join('.')}"`)
      .join('; ');

    throw new InputError(`${errorMessage}`);
  }

  if (
    parsed.data.type !== aggregationTypes.statusGrouped &&
    parsed.data.options?.thresholds
  ) {
    validateThresholdsForAggregation(parsed.data.options.thresholds, 'number');
  }

  return parsed.data;
}
