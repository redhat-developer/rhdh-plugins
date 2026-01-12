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
import { InputError, NotAllowedError, NotFoundError } from '@backstage/errors';
import express, { Request } from 'express';
import Router from 'express-promise-router';
import type { CatalogMetricService } from './CatalogMetricService';
import type { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';
import {
  type HttpAuthService,
  type PermissionsService,
} from '@backstage/backend-plugin-api';
import type { CatalogService } from '@backstage/plugin-catalog-node';
import {
  AuthorizeResult,
  BasicPermission,
  PolicyDecision,
  ResourcePermission,
} from '@backstage/plugin-permission-common';
import { scorecardMetricReadPermission } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  filterAuthorizedMetrics,
  checkEntityAccess,
} from '../permissions/permissionUtils';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { validateCatalogMetricsSchema } from '../validation/validateCatalogMetricsSchema';
import { getEntitiesOwnedByUser } from '../utils/getEntitiesOwnedByUser';
import { parseCommaSeparatedString } from '../utils/parseCommaSeparatedString';
import { validateMetricsSchema } from '../validation/validateMetricsSchema';

export type ScorecardRouterOptions = {
  metricProvidersRegistry: MetricProvidersRegistry;
  catalogMetricService: CatalogMetricService;
  catalog: CatalogService;
  httpAuth: HttpAuthService;
  permissions: PermissionsService;
};

export async function createRouter({
  metricProvidersRegistry,
  catalogMetricService,
  catalog,
  httpAuth,
  permissions,
}: ScorecardRouterOptions): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  const authorizeConditional = async (
    request: Request,
    permission: ResourcePermission<'scorecard-metric'> | BasicPermission,
  ) => {
    const credentials = await httpAuth.credentials(request);
    let decision: PolicyDecision;

    if (permission.type === 'resource') {
      decision = (
        await permissions.authorizeConditional([{ permission }], {
          credentials,
        })
      )[0];
    } else {
      decision = (
        await permissions.authorize([{ permission }], {
          credentials,
        })
      )[0];
    }

    if (decision.result === AuthorizeResult.DENY) {
      throw new NotAllowedError(); // 403
    }

    return {
      decision,
      conditions:
        decision.result === AuthorizeResult.CONDITIONAL
          ? decision.conditions
          : undefined,
    };
  };

  router.get('/metrics', async (req, res) => {
    const { metricIds, datasource } = validateMetricsSchema(req.query);

    if (metricIds && datasource) {
      throw new InputError('Cannot filter by both metricIds and datasource');
    }

    if (metricIds) {
      return res.json({
        metrics: metricProvidersRegistry.listMetrics(
          parseCommaSeparatedString(metricIds),
        ),
      });
    }

    if (datasource) {
      return res.json({
        metrics: metricProvidersRegistry.listMetricsByDatasource(datasource),
      });
    }

    return res.json({ metrics: metricProvidersRegistry.listMetrics() });
  });

  router.get('/metrics/catalog/:kind/:namespace/:name', async (req, res) => {
    const { conditions } = await authorizeConditional(
      req,
      scorecardMetricReadPermission,
    );

    const { kind, namespace, name } = req.params;

    const { metricIds } = validateCatalogMetricsSchema(req.query);

    const entityRef = stringifyEntityRef({ kind, namespace, name });

    // Check if user has permission to read this specific catalog entity
    await checkEntityAccess(entityRef, req, permissions, httpAuth);

    const metricIdArray = metricIds
      ? parseCommaSeparatedString(metricIds)
      : undefined;

    const results = await catalogMetricService.getLatestEntityMetrics(
      entityRef,
      metricIdArray,
      conditions,
    );
    res.json(results);
  });

  router.get('/metrics/:metricId/catalog/aggregations', async (req, res) => {
    const { metricId } = req.params;

    const { conditions } = await authorizeConditional(
      req,
      scorecardMetricReadPermission,
    );

    const metric = metricProvidersRegistry.getMetric(metricId);
    const authorizedMetrics = filterAuthorizedMetrics([metric], conditions);

    if (authorizedMetrics.length === 0) {
      throw new NotAllowedError(
        `To view the scorecard metrics, your administrator must grant you the required permission.`,
      );
    }

    const credentials = await httpAuth.credentials(req, { allow: ['user'] });
    const userEntityRef = credentials?.principal?.userEntityRef;

    if (!userEntityRef) {
      throw new NotFoundError('User entity reference not found');
    }

    const entitiesOwnedByAUser = await getEntitiesOwnedByUser(userEntityRef, {
      catalog,
      credentials,
    });

    if (entitiesOwnedByAUser.length === 0) {
      res.json([]);
      return;
    }

    for (const entityRef of entitiesOwnedByAUser) {
      await checkEntityAccess(entityRef, req, permissions, httpAuth);
    }

    const aggregatedMetrics =
      await catalogMetricService.getAggregatedMetricsByEntityRefs(
        entitiesOwnedByAUser,
        [metricId],
        conditions,
      );

    res.json(aggregatedMetrics);
  });

  return router;
}
