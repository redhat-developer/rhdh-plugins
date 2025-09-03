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

import {
  PermissionCondition,
  PermissionCriteria,
  PermissionRuleParams,
} from '@backstage/plugin-permission-common';

import { Metric } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { rules as scorecardRules } from './rules';

export const matches = (
  metric: Metric,
  filters?: PermissionCriteria<
    PermissionCondition<string, PermissionRuleParams>
  >,
): boolean => {
  if (!filters) {
    return true;
  }

  if ('allOf' in filters) {
    return filters.allOf.every(filter => matches(metric, filter));
  }

  if ('anyOf' in filters) {
    return filters.anyOf.some(filter => matches(metric, filter));
  }

  if ('not' in filters) {
    return !matches(metric, filters.not);
  }
  return (
    Object.values(scorecardRules)
      .find(r => r.name === filters.rule)
      ?.apply(metric, filters.params ?? {}) ?? false
  );
};

export const filterAuthorizedMetrics = (
  metrics: Metric[],
  filter?: PermissionCriteria<
    PermissionCondition<string, PermissionRuleParams>
  >,
) => {
  if (!filter) {
    return metrics;
  }

  return metrics.filter(metric => matches(metric, filter));
};
