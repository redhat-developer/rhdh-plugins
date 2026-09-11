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
  LoggerService,
  PermissionsService,
} from '@backstage/backend-plugin-api';
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';
import { scorecardMetricReadPermission } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';
import {
  authorizeConditional,
  filterAuthorizedMetrics,
} from '../permissions/permissionUtils';
import { filterEnabledMetrics } from '../utils/metricUtils';

export const createListMetricsAction = ({
  actionsRegistry,
  config,
  permissions,
  metricProvidersRegistry,
  logger,
}: {
  actionsRegistry: ActionsRegistryService;
  config: Config;
  permissions: PermissionsService;
  metricProvidersRegistry: MetricProvidersRegistry;
  logger: LoggerService;
}) => {
  actionsRegistry.register({
    name: 'list-metrics',
    title: 'List Metrics',
    attributes: {
      readOnly: true,
    },
    description:
      'Lists all available scorecard metrics and their datasources. ' +
      'Use this to discover which metrics are configured before querying ' +
      'entity-specific values with get-entity-metrics.',
    schema: {
      input: z => z.object({}),
      output: z =>
        z.object({
          metrics: z.array(
            z.object({
              id: z.string(),
              title: z.string(),
              description: z.string(),
              type: z.enum(['number', 'boolean']),
              unit: z.string().optional(),
              history: z.boolean().optional(),
              defaultVisualization: z.enum(['donut', 'sparkline']).optional(),
              collectorIds: z.array(z.string()).optional(),
            }),
          ),
        }),
    },
    action: async ({ credentials }) => {
      const { conditions } = await authorizeConditional(
        credentials,
        permissions,
        scorecardMetricReadPermission,
      );

      const allMetrics = filterEnabledMetrics(
        config,
        metricProvidersRegistry.listMetrics(),
        metricId => metricProvidersRegistry.getProvider(metricId),
        logger,
      );
      const metrics = filterAuthorizedMetrics(allMetrics, conditions);

      return { output: { metrics } };
    },
  });
};
