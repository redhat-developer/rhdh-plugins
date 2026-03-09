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

/**
 * Check if the metric is disabled by app-config or entity annotation.
 * 1. Top-level disabledMetrics: always disabled, entity cannot override.
 * 2. entityOverrides.disabledMetrics.enabled: if false, entity annotation is ignored.
 * 3. entityOverrides.disabledMetrics.except: when entity override is allowed, these metrics cannot be disabled by entity.
 * @param config - Backstage config
 * @param providerId - The ID of the provider
 * @param entity - The entity to check
 * @param logger - The logger to use
 * @returns true if the metric is disabled, false otherwise
 */
export function isMetricIdExcluded(
  config: Config,
  providerId: string,
  entity: Entity,
  logger: LoggerService,
): boolean {
  const disabledMetricsFromAppConfig = config.getOptionalStringArray(
    'scorecard.disabledMetrics',
  );
  logger.debug(
    `Loaded scorecard.disabledMetrics from app-config: ${JSON.stringify(
      disabledMetricsFromAppConfig,
    )}`,
  );

  const isDisabledByAppConfig =
    disabledMetricsFromAppConfig?.includes(providerId) ?? false;

  // if the metric is disabled by app-config, always disabled (entity cannot override)
  if (isDisabledByAppConfig) {
    logger.info(`Disabled metric by app-config: ${providerId}`);
    return true;
  }

  // entityOverrides.disabledMetrics: when false, entity list still applied (union) but entity cannot override to re-enable
  const entityOverridesDisabledMetricsConfig = config.getOptionalConfig(
    'scorecard.entityOverrides.disabledMetrics',
  );
  const entityOverrideEnabled =
    entityOverridesDisabledMetricsConfig?.getOptionalBoolean('enabled');
  const exceptList =
    entityOverridesDisabledMetricsConfig?.getOptionalStringArray('except');
  logger.debug(
    `Loaded entityOverrides.disabledMetrics (enabled=${entityOverrideEnabled}, except=${JSON.stringify(
      exceptList,
    )})`,
  );

  const disabledMetricsFromComponentAnnotation = entity.metadata.annotations?.[
    'scorecard.io/disabled-metrics'
  ]
    ?.split(',')
    .map((s: string) => s.trim());
  logger.debug(
    `Loaded scorecard.io/disabled-metrics annotation: ${JSON.stringify(
      disabledMetricsFromComponentAnnotation,
    )}`,
  );

  const isInExceptList = exceptList?.includes(providerId) ?? false;
  const isDisabledByAnnotation =
    disabledMetricsFromComponentAnnotation?.includes(providerId) ?? false;

  // when entity overrides are disabled (enabled === false): apply both app-config and entity list (union) — entity cannot override to re-enable
  if (entityOverrideEnabled === false) {
    if (isDisabledByAnnotation) {
      logger.info(
        `Disabled metric by annotation (entity overrides disabled): ${providerId}`,
      );
      return true;
    }
    return false;
  }

  // when entity overrides are allowed (enabled !== false): except list = metrics entity cannot disable
  if (isDisabledByAnnotation && isInExceptList) {
    logger.info(
      `Entity override: metric disabled by annotation but in entityOverrides.disabledMetrics.except (must run): ${providerId}`,
    );
    return false;
  }

  if (isDisabledByAnnotation && !isInExceptList) {
    logger.info(`Disabled metric by annotation: ${providerId}`);
    return true;
  }

  return false;
}
