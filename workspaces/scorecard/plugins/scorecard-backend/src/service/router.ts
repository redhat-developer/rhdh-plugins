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
import { InputError, NotAllowedError } from '@backstage/errors';
import { z } from 'zod';
import express, { Request } from 'express';
import Router from 'express-promise-router';
import type { CatalogMetricService } from './CatalogMetricService';
import type { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';
import {
  type HttpAuthService,
  type PermissionsService,
} from '@backstage/backend-plugin-api';
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

export type ScorecardRouterOptions = {
  metricProvidersRegistry: MetricProvidersRegistry;
  catalogMetricService: CatalogMetricService;
  httpAuth: HttpAuthService;
  permissions: PermissionsService;
};

export async function createRouter({
  metricProvidersRegistry,
  catalogMetricService,
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
    const { conditions } = await authorizeConditional(
      req,
      scorecardMetricReadPermission,
    );

    const metricsSchema = z.object({
      datasource: z.string().min(1).optional(),
    });

    const parsed = metricsSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new InputError(`Invalid query parameters: ${parsed.error.message}`);
    }

    const { datasource } = parsed.data;

    let metrics;
    if (datasource) {
      metrics = metricProvidersRegistry.listMetricsByDatasource(datasource);
    } else {
      metrics = metricProvidersRegistry.listMetrics();
    }

    res.json({
      metrics: filterAuthorizedMetrics(metrics, conditions),
    });
  });

  router.get('/metrics/catalog/:kind/:namespace/:name', async (req, res) => {
    const { conditions } = await authorizeConditional(
      req,
      scorecardMetricReadPermission,
    );

    const { kind, namespace, name } = req.params;
    const { metricIds } = req.query;

    validateCatalogMetricsSchema(req.query);

    const entityRef = stringifyEntityRef({ kind, namespace, name });

    // Check if user has permission to read this specific catalog entity
    await checkEntityAccess(entityRef, req, permissions, httpAuth);

    const metricIdArray =
      typeof metricIds === 'string'
        ? parseCommaSeparatedString(metricIds)
        : undefined;

    const results = await catalogMetricService.getLatestEntityMetrics(
      entityRef,
      metricIdArray,
      conditions,
    );
    res.json(results);
  });

  router.get('/metrics/catalog/aggregated', async (req, res) => {
    const { metricIds } = req.query;

    await authorizeConditional(req, scorecardMetricReadPermission);

    validateCatalogMetricsSchema(req.query);

    const credentials = await httpAuth.credentials(req, { allow: ['user'] });
    const userEntityRef = credentials?.principal?.userEntityRef;

    if (!userEntityRef) {
      throw new NotAllowedError('User entity reference not found');
    }

    const entitiesOwnedByAUser = await getEntitiesOwnedByUser(userEntityRef, {
      catalog: catalogMetricService.getCatalogService(),
      credentials,
    });

    if (entitiesOwnedByAUser.length === 0) {
      res.json([]);
      return;
    }

    for (const entityRef of entitiesOwnedByAUser) {
      await checkEntityAccess(entityRef, req, permissions, httpAuth);
    }

    const metricIdsParsed =
      typeof metricIds === 'string'
        ? parseCommaSeparatedString(metricIds)
        : undefined;

    const aggregatedMetrics =
      await catalogMetricService.getAggregatedMetricsByEntityRefs(
        entitiesOwnedByAUser,
        metricIdsParsed,
      );

    res.json(aggregatedMetrics);
  });

  return router;
}
