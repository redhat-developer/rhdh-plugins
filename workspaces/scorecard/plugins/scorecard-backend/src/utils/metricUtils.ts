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
import { parseCommaSeparatedString } from './parseCommaSeparatedString';

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
