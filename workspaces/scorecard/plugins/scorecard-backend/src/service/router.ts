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
  AuthenticationError,
  InputError,
  NotAllowedError,
} from '@backstage/errors';
import express from 'express';
import Router from 'express-promise-router';
import type { CatalogMetricService } from './CatalogMetricService';
import type { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';
import {
  LoggerService,
  type HttpAuthService,
  type PermissionsService,
} from '@backstage/backend-plugin-api';
import type { CatalogService } from '@backstage/plugin-catalog-node';
import {
  filterAuthorizedMetrics,
  checkEntityAccess,
} from '../permissions/permissionUtils';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { validateMetricIdsQueryParams } from '../middlewares/validateMetricIdsQueryParams';
import { getEntitiesOwnedByUser } from '../utils/getEntitiesOwnedByUser';
import { parseCommaSeparatedString } from '../utils/parseCommaSeparatedString';
import { AggregatedMetricMapper } from './mappers';
import { validateDrillDownMetricsSchema } from '../validation/validateDrillDownMetricsSchema';
import { validateAggregationIdParam } from '../middlewares/validateAggregationIdParam';
import { authorizeConditional } from '../permissions/permissionUtils';
import { getUserEntityRef } from './utils';
import {
  aggregationTypes,
  scorecardMetricReadPermission,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { validateDatasourceQueryParams } from '../middlewares/validateDatasourceQueryParams';

export type ScorecardRouterOptions = {
  metricProvidersRegistry: MetricProvidersRegistry;
  catalogMetricService: CatalogMetricService;
  catalog: CatalogService;
  httpAuth: HttpAuthService;
  permissions: PermissionsService;
  logger: LoggerService;
};

export async function createRouter({
  metricProvidersRegistry,
  catalogMetricService,
  catalog,
  httpAuth,
  permissions,
  logger,
}: ScorecardRouterOptions): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  router.get(
    '/metrics',
    validateMetricIdsQueryParams,
    validateDatasourceQueryParams,
    async (req, res) => {
      const { metricIds, datasource } = req.query;

      if (metricIds && datasource) {
        throw new InputError('Cannot filter by both metricIds and datasource');
      }

      if (metricIds) {
        return res.json({
          metrics: metricProvidersRegistry.listMetrics(
            parseCommaSeparatedString(metricIds as string),
          ),
        });
      }

      if (datasource) {
        return res.json({
          metrics: metricProvidersRegistry.listMetricsByDatasource(
            datasource as string,
          ),
        });
      }

      return res.json({ metrics: metricProvidersRegistry.listMetrics() });
    },
  );

  router.get(
    '/metrics/catalog/:kind/:namespace/:name',
    validateMetricIdsQueryParams,
    async (req, res) => {
      const { metricIds } = req.query;

      const { conditions } = await authorizeConditional(
        await httpAuth.credentials(req),
        permissions,
        scorecardMetricReadPermission,
      );

      const { kind, namespace, name } = req.params;

      const entityRef = stringifyEntityRef({ kind, namespace, name });

      // Check if user has permission to read this specific catalog entity
      await checkEntityAccess(entityRef, req, permissions, httpAuth);

      const metricIdArray = metricIds
        ? parseCommaSeparatedString(metricIds as string)
        : undefined;

      const results = await catalogMetricService.getLatestEntityMetrics(
        entityRef,
        metricIdArray,
        conditions,
      );
      res.json(results);
    },
  );

  // Deprecated (RFC 8594): use GET /aggregations/:aggregationId instead.
  router.get(
    '/metrics/:metricId/catalog/aggregations',
    (req, res, next) => {
      const { metricId } = req.params;
      const successorPath = `${req.baseUrl}/aggregations/${encodeURIComponent(
        metricId,
      )}`;
      res.setHeader('Deprecation', 'true');
      res.setHeader('Link', `<${successorPath}>; rel="alternate"`);
      next();
    },
    async (req, res) => {
      const { metricId } = req.params;

      const { conditions } = await authorizeConditional(
        await httpAuth.credentials(req),
        permissions,
        scorecardMetricReadPermission,
      );

      const provider = metricProvidersRegistry.getProvider(metricId);
      const metric = provider.getMetric();
      const authorizedMetrics = filterAuthorizedMetrics([metric], conditions);

      if (authorizedMetrics.length === 0) {
        throw new NotAllowedError(
          `To view the scorecard metrics, your administrator must grant you the required permission.`,
        );
      }

      const credentials = await httpAuth.credentials(req, { allow: ['user'] });
      const userEntityRef = credentials?.principal?.userEntityRef;

      if (!userEntityRef) {
        throw new AuthenticationError('User entity reference not found');
      }

      const entitiesOwnedByAUser = await getEntitiesOwnedByUser(userEntityRef, {
        catalog,
        credentials,
      });

      for (const entityRef of entitiesOwnedByAUser) {
        await checkEntityAccess(entityRef, req, permissions, httpAuth);
      }

      const thresholds = provider.getMetricThresholds();
      const aggregatedMetric =
        await catalogMetricService.getAggregatedMetricByEntityRefs(
          entitiesOwnedByAUser,
          metricId,
          aggregationTypes.statusGrouped, // By default, used the status grouped aggregation type
        );

      logger.warn(
        `Deprecated Scorecard API: GET /metrics/${metricId}/catalog/aggregations is deprecated; use GET /aggregations/:aggregationId (e.g. when the aggregation id matches the metric id, GET /aggregations/${metricId}).`,
      );

      res.json(
        AggregatedMetricMapper.toAggregatedMetricResult(
          metric,
          thresholds,
          aggregatedMetric,
        ),
      );
    },
  );

  router.get(
    '/metrics/:metricId/catalog/aggregations/entities',
    async (req, res) => {
      const { metricId } = req.params;

      const {
        page,
        pageSize,
        status,
        owner,
        kind,
        namespace,
        entityName,
        sortBy,
        sortOrder,
      } = validateDrillDownMetricsSchema(req.query, logger);

      const credentials = await httpAuth.credentials(req, { allow: ['user'] });

      const { conditions } = await authorizeConditional(
        credentials,
        permissions,
        scorecardMetricReadPermission,
      );

      const metric = metricProvidersRegistry.getMetric(metricId);
      const authorizedMetrics = filterAuthorizedMetrics([metric], conditions);

      if (authorizedMetrics.length === 0) {
        throw new NotAllowedError(
          `To view the scorecard metrics, your administrator must grant you the required permission.`,
        );
      }

      const userEntityRef = credentials?.principal?.userEntityRef;

      if (!userEntityRef) {
        throw new AuthenticationError('User entity reference not found');
      }

      const entityMetrics = await catalogMetricService.getEntityMetricDetails(
        metricId,
        credentials,
        {
          status,
          owner,
          kind,
          entityName,
          namespace,
          sortBy,
          sortOrder,
          page,
          limit: pageSize,
        },
      );

      res.json(entityMetrics);
    },
  );

  router.get(
    '/aggregations/:aggregationId',
    validateAggregationIdParam,
    async (req, res) => {
      const { aggregationId } = req.params;

      const credentials = await httpAuth.credentials(req, { allow: ['user'] });

      const { conditions } = await authorizeConditional(
        credentials,
        permissions,
        scorecardMetricReadPermission,
      );

      const userEntityRef = await getUserEntityRef(credentials);

      const [aggregationConfig] = catalogMetricService.getAggregationConfigs([
        aggregationId,
      ]);

      const provider = metricProvidersRegistry.getProvider(
        aggregationConfig?.metricId ?? aggregationId,
      );
      const metric = provider.getMetric();

      const entitiesOwnedByAUser = await getEntitiesOwnedByUser(userEntityRef, {
        catalog,
        credentials,
      });
      for (const entityRef of entitiesOwnedByAUser) {
        await checkEntityAccess(entityRef, req, permissions, httpAuth);
      }

      const authorizedMetrics = filterAuthorizedMetrics([metric], conditions);
      if (authorizedMetrics.length === 0) {
        throw new NotAllowedError(
          `To view the aggregation of a scorecard metric, your administrator must grant you the required permission.`,
        );
      }

      const thresholds = provider.getMetricThresholds();

      const aggregatedMetric =
        await catalogMetricService.getAggregatedMetricByEntityRefs(
          entitiesOwnedByAUser,
          metric.id,
          aggregationConfig?.type ?? aggregationTypes.statusGrouped,
        );

      res.json(
        AggregatedMetricMapper.toAggregatedMetricResult(
          metric,
          thresholds,
          aggregatedMetric,
          aggregationConfig,
        ),
      );
    },
  );

  router.get(
    '/aggregations/:aggregationId/metadata',
    validateAggregationIdParam,
    async (req, res) => {
      const { aggregationId } = req.params;

      const [aggregationConfig] = catalogMetricService.getAggregationConfigs([
        aggregationId,
      ]);

      const provider = metricProvidersRegistry.getProvider(
        aggregationConfig?.metricId ?? aggregationId,
      );
      const metric = provider.getMetric();

      res.json(
        AggregatedMetricMapper.toAggregationMetadata(metric, aggregationConfig),
      );
    },
  );

  return router;
}
