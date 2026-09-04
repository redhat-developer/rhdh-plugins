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
import type { Entity } from '@backstage/catalog-model';
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { Metric } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import type { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { parseCommaSeparatedString } from './parseCommaSeparatedString';
import {
  resolveMetricEnabledFromConfig,
  resolveProviderEnabledFromConfig,
} from './metricProviderConfigKeys';

/**
 * Check if the metric is disabled by app-config, if is disabled by the entity annotation and if it has any exception rule.
 *
 * @param config - Backstage config
 * @param metricId - The ID of the metric
 * @param entity - The entity to check
 * @param logger - The logger to use
 * @returns true if the metric is disabled, false otherwise.
 */
export function isMetricIdDisabled(
  config: Config,
  metricId: string,
  entity: Entity,
  logger: LoggerService,
): boolean {
  const disabledMetricsFromAppConfig =
    config.getOptionalStringArray('scorecard.disabledMetrics') ?? [];
  const isDisabledByAppConfig = disabledMetricsFromAppConfig.includes(metricId);

  if (isDisabledByAppConfig) {
    logger.debug(`Disabled metric by app-config: ${metricId}`);
    return true;
  }

  const entityAnnotationsGlobalEnabled = config.getOptionalBoolean(
    'scorecard.entityAnnotations.enabled',
  );
  if (entityAnnotationsGlobalEnabled === false) {
    return false;
  }

  const entityAnnotationsDisabledMetricsConfig = config.getOptionalConfig(
    'scorecard.entityAnnotations.disabledMetrics',
  );

  const entityAnnotationEnabled =
    entityAnnotationsDisabledMetricsConfig?.getOptionalBoolean('enabled');
  const disabledMetricsFromComponentAnnotation = parseCommaSeparatedString(
    entity.metadata.annotations?.['scorecard.io/disabled-metrics'] ?? '',
  );
  const isDisabledByAnnotation =
    disabledMetricsFromComponentAnnotation?.includes(metricId) ?? false;

  if (entityAnnotationEnabled === false) {
    return false;
  }
  const exceptList =
    entityAnnotationsDisabledMetricsConfig?.getOptionalStringArray('except') ??
    [];
  const isInExceptList = exceptList?.includes(metricId);

  if (isDisabledByAnnotation && isInExceptList) {
    return false;
  }

  if (isDisabledByAnnotation && !isInExceptList) {
    return true;
  }

  return false;
}

/**
 * Check whether a metric is enabled by default, considering code-level
 * defaults and config-level overrides.
 *
 * Resolution order (first defined value wins):
 * 1. Config metric `enabled` — most specific config
 * 2. Code metric `enabled` field — code-level default
 * 3. Config provider `enabled` — provider config
 * 4. Code provider `isEnabled()` — provider code default
 * 5. `true` — backward-compatible default
 *
 * This check is independent of the global `disabledMetrics` list and
 * entity annotations which are handled by {@link isMetricIdDisabled}.
 */
export function isMetricEnabledByDefault(
  config: Config,
  metric: Metric,
  provider: MetricProvider,
): boolean {
  const datasourceId = provider.getProviderDatasourceId();
  const providerId = provider.getProviderId();

  // 1. Config metric enabled (most specific)
  const metricConfigEnabled = resolveMetricEnabledFromConfig(
    config,
    datasourceId,
    providerId,
    metric.id,
  );
  if (metricConfigEnabled !== undefined) {
    return metricConfigEnabled;
  }

  // 2. Code metric enabled
  if (metric.enabled !== undefined) {
    return metric.enabled;
  }

  // 3. Config provider enabled
  const providerConfigEnabled = resolveProviderEnabledFromConfig(
    config,
    datasourceId,
    providerId,
  );
  if (providerConfigEnabled !== undefined) {
    return providerConfigEnabled;
  }

  // 4. Code provider isEnabled()
  if (provider.isEnabled) {
    return provider.isEnabled();
  }

  // 5. Default: enabled
  return true;
}
