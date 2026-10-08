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

/**
 * Whether entity threshold annotations overrides are allowed for a metric.
 *
 * Honors `scorecard.entityAnnotations.enabled` (global) and
 * `scorecard.entityAnnotations.thresholds` (`enabled` / `except`).
 * When unset, annotation overrides are allowed (same default as disabledMetrics).
 */
export function areThresholdAnnotationOverridesAllowed(
  config: Config,
  metricId: string,
): boolean {
  const entityAnnotationsGlobalEnabled = config.getOptionalBoolean(
    'scorecard.entityAnnotations.enabled',
  );
  if (entityAnnotationsGlobalEnabled === false) {
    return false;
  }

  const entityAnnotationsThresholdsConfig = config.getOptionalConfig(
    'scorecard.entityAnnotations.thresholds',
  );
  const entityAnnotationsThresholdsEnabled =
    entityAnnotationsThresholdsConfig?.getOptionalBoolean('enabled');
  if (entityAnnotationsThresholdsEnabled === false) {
    return false;
  }

  const exceptList =
    entityAnnotationsThresholdsConfig?.getOptionalStringArray('except') ?? [];
  if (exceptList.includes(metricId)) {
    return false;
  }

  return true;
}
