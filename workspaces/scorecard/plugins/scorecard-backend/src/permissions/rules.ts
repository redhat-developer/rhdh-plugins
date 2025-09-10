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
  createPermissionResourceRef,
  createPermissionRule,
} from '@backstage/plugin-permission-node';
import { z } from 'zod';
import {
  Metric,
  RESOURCE_TYPE_SCORECARD_METRIC,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

export type ScorecardFilter = {
  key: string;
  values: Array<string> | undefined;
};

export type ScorecardFilters =
  | { anyOf: ScorecardFilters[] }
  | { allOf: ScorecardFilters[] }
  | { not: ScorecardFilters }
  | ScorecardFilter;

export const scorecardMetricPermissionResourceRef = createPermissionResourceRef<
  Metric,
  ScorecardFilter
>().with({
  pluginId: 'scorecard',
  resourceType: RESOURCE_TYPE_SCORECARD_METRIC,
});

const hasMetricId = createPermissionRule({
  name: 'HAS_METRIC_ID',
  description: 'Should allow users to access metrics with specified metric IDs',
  resourceRef: scorecardMetricPermissionResourceRef,

  paramsSchema: z.object({
    metricIds: z
      .string()
      .array()
      .optional()
      .describe('List of metric IDs to match on'),
  }),
  apply: (metric: Metric, { metricIds }) => {
    return metricIds && metricIds.length > 0
      ? metricIds.includes(metric.id)
      : true;
  },
  toQuery: ({ metricIds }) => ({ key: 'metricId', values: metricIds }),
});

export const rules = { hasMetricId };
