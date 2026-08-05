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
  readSchedulerServiceTaskScheduleDefinitionFromConfig,
  type SchedulerServiceTaskScheduleDefinition,
} from '@backstage/backend-plugin-api';

/**
 * Local config key for a provider under `scorecard.metricProviders.<datasource>.<key>`.
 * Provider IDs are validated at registry startup as `<datasource>.<providerName>`.
 */
export function getProviderLocalConfigKey(
  providerId: string,
  datasourceId: string,
): string {
  return providerId.slice(datasourceId.length + 1);
}

/**
 * Local config key for a metric under
 * `scorecard.metricProviders.<datasource>.<providerName>.metrics.<key>`.
 * Metric IDs are validated at registry startup as `<datasource>.<metricName>`.
 */
export function getMetricLocalConfigKey(
  metricId: string,
  datasourceId: string,
): string {
  return metricId.slice(datasourceId.length + 1);
}

/** Get provider thresholds config key under
 *  `scorecard.metricProviders.<datasource>.<providerName>.thresholds`
 */
export function getProviderThresholdsConfigPath(
  datasourceId: string,
  providerId: string,
): string {
  const providerKey = getProviderLocalConfigKey(providerId, datasourceId);
  return `scorecard.metricProviders.${datasourceId}.${providerKey}.thresholds`;
}

/** Get metric thresholds config key under
 * `scorecard.metricProviders.<datasource>.<providerName>.metrics.<metricName>.thresholds`
 */
export function getMetricThresholdsConfigPath(
  datasourceId: string,
  providerId: string,
  metricId: string,
): string {
  const providerKey = getProviderLocalConfigKey(providerId, datasourceId);
  const metricKey = getMetricLocalConfigKey(metricId, datasourceId);
  return (
    `scorecard.metricProviders.${datasourceId}.${providerKey}` +
    `.metrics.${metricKey}.thresholds`
  );
}

/** Get provider schedule config key under `scorecard.metricProviders.<datasource>.<providerName>.schedule` */
export function getProviderScheduleConfigPath(
  datasourceId: string,
  providerId: string,
): string {
  const providerKey = getProviderLocalConfigKey(providerId, datasourceId);
  return `scorecard.metricProviders.${datasourceId}.${providerKey}.schedule`;
}

/**
 * Resolves the provider schedule from config.
 * Returns undefined when not set (caller uses the default schedule).
 */
export function resolveScheduleFromConfig(
  config: Config,
  datasourceId: string,
  providerId: string,
): SchedulerServiceTaskScheduleDefinition | undefined {
  const schedulePath = getProviderScheduleConfigPath(datasourceId, providerId);

  if (!config.has(schedulePath)) {
    return undefined;
  }

  return readSchedulerServiceTaskScheduleDefinitionFromConfig(
    config.getConfig(schedulePath),
  );
}

/**
 * Resolves the thresholds config path for a metric.
 * Most specific wins: metric > provider.
 * Returns undefined when no thresholds are set.
 */
export function resolveThresholdsConfigPath(
  config: Config,
  datasourceId: string,
  providerId: string,
  metricId: string,
): string | undefined {
  const paths = [
    getMetricThresholdsConfigPath(datasourceId, providerId, metricId),
    getProviderThresholdsConfigPath(datasourceId, providerId),
  ];
  return paths.find(path => config.has(path));
}
