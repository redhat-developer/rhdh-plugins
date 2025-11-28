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
  MetricType,
  ThresholdConfig,
  ThresholdRule,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  ThresholdConfigFormatError,
  validateThresholds,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { isError } from '@backstage/errors';
import type { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

function parseEntityOverrideThresholds(
  entity: Entity,
  providerId: string,
  metricType: MetricType,
): ThresholdRule[] {
  const annotations = entity.metadata?.annotations || {};
  const prefix = `scorecard.io/${providerId}.thresholds.rules.`;
  const overrides: ThresholdRule[] = [];

  for (const [annotationKey, expression] of Object.entries(annotations)) {
    if (annotationKey.startsWith(prefix) && expression) {
      const key = annotationKey.substring(prefix.length);
      const entityRule = { key, expression };
      try {
        validateThresholds({ rules: [entityRule] }, metricType);
        overrides.push(entityRule);
      } catch (e) {
        if (isError(e)) {
          throw new ThresholdConfigFormatError(
            `Invalid threshold annotation '${annotationKey}: ${expression}' in entity '${stringifyEntityRef(
              entity,
            )}': ${e.message}`,
          );
        }
        throw e;
      }
    }
  }

  return overrides;
}

export function mergeEntityAndProviderThresholds(
  entity: Entity,
  provider: MetricProvider,
): ThresholdConfig {
  const providerThresholds = provider.getMetricThresholds();
  const entityOverrideThresholds = parseEntityOverrideThresholds(
    entity,
    provider.getProviderId(),
    provider.getMetricType(),
  );

  const mergedRules = [...providerThresholds.rules];
  for (const override of entityOverrideThresholds) {
    const foundKey = mergedRules.findIndex(rule => rule.key === override.key);
    if (foundKey === -1) {
      throw new ThresholdConfigFormatError(
        `Unable to override ${stringifyEntityRef(
          entity,
        )} thresholds by ${JSON.stringify(
          override,
        )}, metric provider ${provider.getProviderId()} does not support key ${
          override.key
        }`,
      );
    }

    mergedRules[foundKey] = override;
  }

  return {
    rules: mergedRules,
  };
}
