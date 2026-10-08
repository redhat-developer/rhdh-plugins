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

import type { ThresholdConfig } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

/** Success when value is >= 80; error otherwise. */
export const mockHigherIsBetterThresholds = {
  rules: [
    {
      key: 'success',
      expression: '>=80',
      color: 'green',
    },
    {
      key: 'error',
      expression: '<80',
      color: 'red',
    },
  ],
} as ThresholdConfig;

/** Error when value is > 50; warning 10–50; success when < 10. */
export const mockLowerIsBetterThresholds = {
  rules: [
    {
      key: 'error',
      expression: '>50',
      color: 'red',
    },
    {
      key: 'warning',
      expression: '10-50',
      color: 'yellow',
    },
    {
      key: 'success',
      expression: '<10',
      color: 'green',
    },
  ],
} as ThresholdConfig;
