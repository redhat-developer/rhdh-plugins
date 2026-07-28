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
 * Local config key for a provider under `scorecard.plugins.<datasource>.metricProviders.<key>`.
 * Provider/metric IDs are validated at registry startup.
 */
export function getProviderLocalConfigKey(
  providerId: string,
  datasourceId: string,
): string {
  return providerId === datasourceId
    ? providerId
    : providerId.slice(datasourceId.length + 1);
}

/**
 * Local config key for a metric under
 * `scorecard.plugins.<datasource>.metricProviders.<provider>.metrics.<key>`.
 * Provider/metric IDs are validated at registry startup.
 */
export function getMetricLocalConfigKey(
  metricId: string,
  datasourceId: string,
): string {
  return metricId.slice(datasourceId.length + 1);
}

/** Get datasource thresholds config key under `scorecard.plugins.<datasource>.thresholds` */
export function getDatasourceThresholdsConfigPath(
  datasourceId: string,
): string {
  return `scorecard.plugins.${datasourceId}.thresholds`;
}

/** Get provider thresholds config key under
 *  `scorecard.plugins.<datasource>.metricProviders.<providerName>.thresholds`
 */
export function getProviderThresholdsConfigPath(
  datasourceId: string,
  providerId: string,
): string {
  const providerKey = getProviderLocalConfigKey(providerId, datasourceId);
  return `scorecard.plugins.${datasourceId}.metricProviders.${providerKey}.thresholds`;
}

/** Get metric thresholds config key under
 * `scorecard.plugins.<datasource>.metricProviders.<providerName>.metrics.<metricName>.thresholds`
 */
export function getMetricThresholdsConfigPath(
  datasourceId: string,
  providerId: string,
  metricId: string,
): string {
  const providerKey = getProviderLocalConfigKey(providerId, datasourceId);
  const metricKey = getMetricLocalConfigKey(metricId, datasourceId);
  return (
    `scorecard.plugins.${datasourceId}.metricProviders.${providerKey}` +
    `.metrics.${metricKey}.thresholds`
  );
}

/** Get datasource schedule config key under `scorecard.plugins.<datasource>.schedule` */
export function getDatasourceScheduleConfigPath(datasourceId: string): string {
  return `scorecard.plugins.${datasourceId}.schedule`;
}

/** Get provider schedule config key under `scorecard.plugins.<datasource>.metricProviders.<providerName>.schedule` */
export function getProviderScheduleConfigPath(
  datasourceId: string,
  providerId: string,
): string {
  const providerKey = getProviderLocalConfigKey(providerId, datasourceId);
  return `scorecard.plugins.${datasourceId}.metricProviders.${providerKey}.schedule`;
}

/**
 * Resolves the schedule from config, preferring provider-level over datasource-level.
 * Returns undefined when neither is set.
 */
export function resolveScheduleFromConfig(
  config: Config,
  datasourceId: string,
  providerId: string,
): SchedulerServiceTaskScheduleDefinition | undefined {
  const schedulePath = [
    getProviderScheduleConfigPath(datasourceId, providerId),
    getDatasourceScheduleConfigPath(datasourceId),
  ].find(path => config.has(path));

  if (!schedulePath) {
    return undefined;
  }

  return readSchedulerServiceTaskScheduleDefinitionFromConfig(
    config.getConfig(schedulePath),
  );
}

/**
 * Resolves the thresholds config path for a metric.
 * Most specific wins: metric > provider > datasource.
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
    getDatasourceThresholdsConfigPath(datasourceId),
  ];
  return paths.find(path => config.has(path));
}
