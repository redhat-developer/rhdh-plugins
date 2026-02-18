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

import { ThresholdConfig } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

export interface DependabotMetricConfig {
  name: string;
  displayTitle: string;
  description: string;
}

export const DEPENDABOT_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'low', expression: '<1' },
    { key: 'medium', expression: '1-4' },
    { key: 'high', expression: '4-7' },
    { key: 'critical', expression: '>7' },
  ],
};
