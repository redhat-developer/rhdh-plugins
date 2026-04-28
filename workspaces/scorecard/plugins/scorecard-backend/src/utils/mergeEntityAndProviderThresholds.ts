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

import { stringifyEntityRef, type Entity } from '@backstage/catalog-model';
import type {
  ThresholdConfig,
  ThresholdRule,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  type MetricProvider,
  validateThresholdsForMetric,
  ThresholdConfigFormatError,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { isError } from '@backstage/errors';

const thresholdRulesAnnotationPrefix = (providerId: string) =>
  `scorecard.io/${providerId}.thresholds.rules.`;

/**
 * Extract threshold override rules from entity annotations for a given provider, doesn't validate rules.
 */
function parseEntityAnnotationThresholds(
  entity: Entity,
  providerId: string,
): ThresholdRule[] {
  const annotations = entity.metadata?.annotations || {};
  const prefix = thresholdRulesAnnotationPrefix(providerId);
  const overrides: ThresholdRule[] = [];

  for (const [annotationKey, expression] of Object.entries(annotations)) {
    if (annotationKey.startsWith(prefix) && expression) {
      const key = annotationKey.substring(prefix.length);
      overrides.push({ key, expression });
    }
  }

  return overrides;
}

export function mergeEntityAndProviderThresholds(
  entity: Entity,
  provider: MetricProvider,
): ThresholdConfig {
  const providerId = provider.getProviderId();
  const providerThresholds = provider.getMetricThresholds();
  const providerMetricType = provider.getMetricType();
  const entityAnnotationThresholds = parseEntityAnnotationThresholds(
    entity,
    providerId,
  );

  const mergedRules = [...providerThresholds.rules];
  for (const override of entityAnnotationThresholds) {
    const foundKey = mergedRules.findIndex(rule => rule.key === override.key);
    if (foundKey === -1) {
      throw new ThresholdConfigFormatError(
        `Unable to override ${stringifyEntityRef(
          entity,
        )} thresholds by ${JSON.stringify(
          override,
        )}, metric provider ${providerId} does not support key ${override.key}`,
      );
    }

    const mergedRule: ThresholdRule = { ...mergedRules[foundKey], ...override };
    try {
      validateThresholdsForMetric({ rules: [mergedRule] }, providerMetricType);
    } catch (e) {
      if (isError(e)) {
        throw new ThresholdConfigFormatError(
          `Invalid threshold annotation '${thresholdRulesAnnotationPrefix(
            providerId,
          )}${override.key}: ${
            override.expression
          }' in entity '${stringifyEntityRef(entity)}': ${e.message}`,
        );
      }
      throw e;
    }

    mergedRules[foundKey] = mergedRule;
  }

  return {
    rules: mergedRules,
  };
}
