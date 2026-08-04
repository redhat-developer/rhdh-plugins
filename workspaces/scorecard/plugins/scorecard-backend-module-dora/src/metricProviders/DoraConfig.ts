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
  CollectorConfig,
  ScorecardThresholdRuleColors,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
  DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
  DORA_DEFAULT_PRODUCTION_ENVIRONMENTS,
} from '../constants';
import { JsonValue } from '@backstage/types';

export type DoraDeploymentFrequencyConfig = {
  deploymentsCollector: CollectorConfig;
  productionEnvironments: string[];
};

export type DoraMedianLeadTimeForChangesConfig = {
  deploymentsCollector: CollectorConfig;
  deploymentPullRequestsCollector: CollectorConfig;
  productionEnvironments: string[];
};

export const DEFAULT_DORA_DEPLOYMENT_FREQUENCY_THRESHOLDS: ThresholdConfig =
  // Calculated metric is deployments/week from a 30-day window
  {
    rules: [
      {
        key: 'elite',
        expression: '>=7',
        color: ScorecardThresholdRuleColors.SUCCESS,
        icon: 'scorecardSuccessStatusIcon',
      },
      {
        key: 'medium',
        expression: '1-7',
        color: ScorecardThresholdRuleColors.WARNING,
        icon: 'scorecardWarningStatusIcon',
      },
      {
        key: 'low',
        expression: '<1',
        color: ScorecardThresholdRuleColors.ERROR,
        icon: 'scorecardErrorStatusIcon',
      },
    ],
  };

export const DEFAULT_DORA_MEDIAN_LEAD_TIME_THRESHOLDS: ThresholdConfig =
  // Calculated metric is in hours from a 30-day window
  {
    rules: [
      {
        key: 'elite',
        expression: '<24',
        color: ScorecardThresholdRuleColors.SUCCESS,
        icon: 'scorecardSuccessStatusIcon',
      },
      {
        key: 'medium',
        expression: '24-168',
        color: ScorecardThresholdRuleColors.WARNING,
        icon: 'scorecardWarningStatusIcon',
      },
      {
        key: 'low',
        expression: '>168',
        color: ScorecardThresholdRuleColors.ERROR,
        icon: 'scorecardErrorStatusIcon',
      },
    ],
  };

function parseCollectorConfig(
  config: Config,
  collectorConfigPath: string,
  defaultId: string,
): CollectorConfig {
  return {
    id: config.getOptionalString(`${collectorConfigPath}.id`) ?? defaultId,
    input:
      config.getOptional<Record<string, JsonValue>>(
        `${collectorConfigPath}.input`,
      ) ?? {},
  };
}

function parseProductionEnvironments(
  config: Config,
  metricConfigPath: string,
): string[] {
  const configured = config.getOptionalStringArray(
    `${metricConfigPath}.options.productionEnvironments`,
  );

  if (!configured || configured.length === 0) {
    return [...DORA_DEFAULT_PRODUCTION_ENVIRONMENTS];
  }

  return configured;
}

/**
 * Parses deployment-frequency provider config from the root Backstage config.
 */
export function parseDoraDeploymentFrequencyConfig(
  config: Config,
): DoraDeploymentFrequencyConfig {
  const providerConfigPath = 'scorecard.plugins.dora.deploymentFrequency';

  return {
    deploymentsCollector: parseCollectorConfig(
      config,
      `${providerConfigPath}.options.collectors.deployments`,
      DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
    ),
    productionEnvironments: parseProductionEnvironments(
      config,
      providerConfigPath,
    ),
  };
}

/**
 * Parses median-lead-time-for-changes provider config from the root Backstage config.
 */
export function parseDoraMedianLeadTimeForChangesConfig(
  config: Config,
): DoraMedianLeadTimeForChangesConfig {
  const providerConfigPath = 'scorecard.plugins.dora.medianLeadTimeForChanges';

  return {
    deploymentsCollector: parseCollectorConfig(
      config,
      `${providerConfigPath}.options.collectors.deployments`,
      DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
    ),
    deploymentPullRequestsCollector: parseCollectorConfig(
      config,
      `${providerConfigPath}.options.collectors.deploymentPullRequests`,
      DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
    ),
    productionEnvironments: parseProductionEnvironments(
      config,
      providerConfigPath,
    ),
  };
}
