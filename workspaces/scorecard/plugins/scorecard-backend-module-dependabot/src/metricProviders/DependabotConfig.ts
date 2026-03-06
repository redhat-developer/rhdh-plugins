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

export type DependabotSeverity = 'critical' | 'high' | 'medium' | 'low';

export type DependabotRepository = {
  owner: string;
  repo: string;
};

export interface DependabotMetricConfig {
  name: string;
  displayTitle: string;
  description: string;
}

export const DEPENDABOT_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'success', expression: '<1' },
    { key: 'warning', expression: '1-7' },
    { key: 'error', expression: '>7' },
  ],
};

export const DEPENDABOT_SEVERITY_METRIC: Record<
  DependabotSeverity,
  { id: string; title: string; description: string }
> = {
  critical: {
    id: 'dependabot.alerts_critical',
    title: 'Dependabot Critical Alerts',
    description:
      'Current count of open critical Dependabot alerts for a given repository.',
  },
  high: {
    id: 'dependabot.alerts_high',
    title: 'Dependabot High Alerts',
    description:
      'Current count of open high-severity Dependabot alerts for a given repository.',
  },
  medium: {
    id: 'dependabot.alerts_medium',
    title: 'Dependabot Medium Alerts',
    description:
      'Current count of open medium-severity Dependabot alerts for a given repository.',
  },
  low: {
    id: 'dependabot.alerts_low',
    title: 'Dependabot Low Alerts',
    description:
      'Current count of open low-severity Dependabot alerts for a given repository.',
  },
};
