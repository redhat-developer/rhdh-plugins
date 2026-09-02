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
import type { JsonObject } from '@backstage/types';
import {
  ScorecardThresholdRuleColors,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { daysToMilliseconds } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { collectorInputHash } from '../service/collectorHash';
import type { DoraCollectorConfig } from '../service/types';
import {
  DORA_DEFAULT_DATA_RETENTION_DAYS,
  DORA_DEFAULT_DEPLOYMENT_LOOKBACK_MS,
  DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
  DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
  DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
  DORA_DEFAULT_PRODUCTION_ENVIRONMENTS,
  DORA_DEFAULT_STALE_AFTER_MS,
  DORA_TIME_WINDOW_DAYS,
} from '../constants';

export type DoraDeploymentFrequencyConfig = {
  deploymentsCollector: DoraCollectorConfig;
  productionEnvironments: string[];
};

export type DoraMedianLeadTimeForChangesConfig = {
  deploymentsCollector: DoraCollectorConfig;
  deploymentPullRequestsCollector: DoraCollectorConfig;
  productionEnvironments: string[];
};

export type DoraMeanTimeToRestoreConfig = {
  incidentsCollector: DoraCollectorConfig;
};

export type DoraChangeFailureRateConfig = {
  deploymentsCollector: DoraCollectorConfig;
  incidentsCollector: DoraCollectorConfig;
  productionEnvironments: string[];
};

export type DoraSyncConfig = {
  staleAfterMs: number;
  deploymentLookbackMs: number;
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

export const DEFAULT_DORA_CHANGE_FAILURE_RATE_THRESHOLDS: ThresholdConfig =
  // Calculated metric is in percentage
  {
    rules: [
      {
        key: 'elite',
        expression: '<5',
        color: ScorecardThresholdRuleColors.SUCCESS,
        icon: 'scorecardSuccessStatusIcon',
      },
      {
        key: 'medium',
        expression: '5-15',
        color: ScorecardThresholdRuleColors.WARNING,
        icon: 'scorecardWarningStatusIcon',
      },
      {
        key: 'low',
        expression: '>15',
        color: ScorecardThresholdRuleColors.ERROR,
        icon: 'scorecardErrorStatusIcon',
      },
    ],
  };

export const DEFAULT_DORA_MEAN_TIME_TO_RESTORE_THRESHOLDS: ThresholdConfig =
  // Calculated metric is in hours
  {
    rules: [
      {
        key: 'elite',
        expression: '<1',
        color: ScorecardThresholdRuleColors.SUCCESS,
        icon: 'scorecardSuccessStatusIcon',
      },
      {
        key: 'medium',
        expression: '1-24',
        color: ScorecardThresholdRuleColors.WARNING,
        icon: 'scorecardWarningStatusIcon',
      },
      {
        key: 'low',
        expression: '>24',
        color: ScorecardThresholdRuleColors.ERROR,
        icon: 'scorecardErrorStatusIcon',
      },
    ],
  };

/**
 * Parses a collector `id` and static `input` object from config and attaches
 * `inputHash`. Shared by all DORA metric provider parsers.
 */
export function parseCollectorConfig(
  config: Config,
  collectorConfigPath: string,
  defaultId: string,
): DoraCollectorConfig {
  const input =
    config
      .getOptionalConfig(`${collectorConfigPath}.input`)
      ?.get<JsonObject>() ?? {};
  return {
    id: config.getOptionalString(`${collectorConfigPath}.id`) ?? defaultId,
    input,
    inputHash: collectorInputHash(input),
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
  const providerConfigPath =
    'scorecard.metricProviders.dora.deploymentFrequency';

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
  const providerConfigPath =
    'scorecard.metricProviders.dora.medianLeadTimeForChanges';

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

/**
 * Parses mean-time-to-restore provider config from the root Backstage config.
 */
export function parseDoraMeanTimeToRestoreConfig(
  config: Config,
): DoraMeanTimeToRestoreConfig {
  const providerConfigPath = 'scorecard.metricProviders.dora.meanTimeToRestore';

  return {
    incidentsCollector: parseCollectorConfig(
      config,
      `${providerConfigPath}.options.collectors.incidents`,
      DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
    ),
  };
}

/**
 * Parses change-failure-rate provider config from the root Backstage config.
 */
export function parseDoraChangeFailureRateConfig(
  config: Config,
): DoraChangeFailureRateConfig {
  const providerConfigPath = 'scorecard.metricProviders.dora.changeFailureRate';

  return {
    deploymentsCollector: parseCollectorConfig(
      config,
      `${providerConfigPath}.options.collectors.deployments`,
      DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
    ),
    incidentsCollector: parseCollectorConfig(
      config,
      `${providerConfigPath}.options.collectors.incidents`,
      DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
    ),
    productionEnvironments: parseProductionEnvironments(
      config,
      providerConfigPath,
    ),
  };
}

/**
 * Parses DORA source-data retention days from the root Backstage config.
 * Must be at least the DORA metric computation window so cleanup cannot delete
 * in-window rows that incremental sync will not backfill.
 */
export function parseDoraDataRetentionDays(config: Config): number {
  const dataRetentionDays =
    config.getOptionalNumber('scorecard.plugins.dora.dataRetentionDays') ??
    DORA_DEFAULT_DATA_RETENTION_DAYS;
  if (dataRetentionDays < DORA_TIME_WINDOW_DAYS) {
    throw new Error(
      `scorecard.plugins.dora.dataRetentionDays must be greater than or equal to ${DORA_TIME_WINDOW_DAYS}`,
    );
  }
  return dataRetentionDays;
}

/**
 * Parses DORA sync service options from `scorecard.plugins.dora`.
 */
export function parseDoraSyncConfig(config: Config): DoraSyncConfig {
  const staleAfterMs =
    config.getOptionalNumber('scorecard.plugins.dora.staleAfterMs') ??
    DORA_DEFAULT_STALE_AFTER_MS;
  if (staleAfterMs < 0) {
    throw new Error(
      'scorecard.plugins.dora.staleAfterMs must be greater than or equal to 0',
    );
  }

  const deploymentLookbackMs =
    config.getOptionalNumber('scorecard.plugins.dora.deploymentLookbackMs') ??
    DORA_DEFAULT_DEPLOYMENT_LOOKBACK_MS;
  if (deploymentLookbackMs < 0) {
    throw new Error(
      'scorecard.plugins.dora.deploymentLookbackMs must be greater than or equal to 0',
    );
  }
  const maxLookbackMs = daysToMilliseconds(DORA_TIME_WINDOW_DAYS);
  if (deploymentLookbackMs > maxLookbackMs) {
    throw new Error(
      `scorecard.plugins.dora.deploymentLookbackMs must be less than or equal to the DORA metric computation window (${DORA_TIME_WINDOW_DAYS} days)`,
    );
  }
  return { staleAfterMs, deploymentLookbackMs };
}
