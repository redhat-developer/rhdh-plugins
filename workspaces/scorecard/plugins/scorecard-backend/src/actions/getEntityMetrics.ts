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
import { PermissionsService } from '@backstage/backend-plugin-api';
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { catalogEntityReadPermission } from '@backstage/plugin-catalog-common/alpha';
import { NotAllowedError } from '@backstage/errors';
import { scorecardMetricReadPermission } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { CatalogMetricService } from '../service/CatalogMetricService';
import { authorizeConditional } from '../permissions/permissionUtils';

export const createGetEntityMetricsAction = ({
  actionsRegistry,
  permissions,
  catalogMetricService,
}: {
  actionsRegistry: ActionsRegistryService;
  permissions: PermissionsService;
  catalogMetricService: CatalogMetricService;
}) => {
  actionsRegistry.register({
    name: 'get-entity-metrics',
    title: 'Get Entity Metrics',
    attributes: {
      readOnly: true,
    },
    description:
      'Returns the latest scorecard metric values for a catalog entity. ' +
      'Provide the entity reference (e.g. "component:default/my-service") to ' +
      'retrieve all scored metrics with their current values, thresholds, and statuses.',
    schema: {
      input: z =>
        z.object({
          entityRef: z
            .string()
            .describe(
              'Entity reference in "kind:namespace/name" format, e.g. "component:default/my-service"',
            ),
        }),
      output: z =>
        z.object({
          metrics: z.array(
            z.object({
              id: z.string(),
              status: z.enum(['success', 'error']),
              metadata: z.object({
                title: z.string(),
                description: z.string(),
                type: z.enum(['number', 'boolean']),
                history: z.boolean().optional(),
              }),
              result: z.object({
                value: z.union([z.number(), z.boolean(), z.null()]),
                timestamp: z.string(),
                thresholdResult: z.object({
                  definition: z.unknown().optional(),
                  status: z.enum(['success', 'error']),
                  evaluation: z.string().nullable().optional(),
                  error: z.string().optional(),
                }),
              }),
              error: z.string().optional(),
            }),
          ),
        }),
    },
    action: async ({ input, credentials }) => {
      const entityAccessDecision = await permissions.authorize(
        [
          {
            permission: catalogEntityReadPermission,
            resourceRef: input.entityRef,
          },
        ],
        { credentials },
      );
      if (entityAccessDecision[0].result !== AuthorizeResult.ALLOW) {
        throw new NotAllowedError(
          `Access to "${input.entityRef}" entity metrics denied`,
        );
      }

      const { conditions } = await authorizeConditional(
        credentials,
        permissions,
        scorecardMetricReadPermission,
      );

      const metrics = await catalogMetricService.getLatestEntityMetrics(
        input.entityRef,
        undefined,
        conditions,
      );

      return { output: { metrics } };
    },
  });
};
