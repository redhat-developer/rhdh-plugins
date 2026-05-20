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

import express from 'express';
import Router from 'express-promise-router';
import type { RouterOptions } from '../models/RouterOptions';
import { createPermissionIntegrationRouter } from '@backstage/plugin-permission-node';
import type { BasicPermission } from '@backstage/plugin-permission-common';
import {
  rosPluginPermissions,
  rosApplyPermissions,
  costPluginPermissions,
  rosClusterSpecificPermission,
  rosClusterProjectPermission,
  costClusterSpecificPermission,
  costClusterProjectPermission,
} from '@red-hat-developer-hub/plugin-cost-management-common/permissions';
import { getAccess } from '../routes/access';
import { getCostManagementAccess } from '../routes/costManagementAccess';
import { secureProxy } from '../routes/secureProxy';
import { applyRecommendation } from '../routes/applyRecommendation';
import { getTokenFromApi } from '../util/tokenUtil';

/**
 * Fetches cluster and project data from the upstream APIs and builds
 * permission objects for every ros/{cluster}, ros/{cluster}/{project},
 * cost/{cluster}, and cost/{cluster}/{project} combination.
 *
 * These permissions must be registered with the permission integration
 * router so that the RBAC backend recognises them as valid and evaluates
 * the corresponding policies instead of returning DENY by default.
 */
async function fetchDynamicPermissions(
  options: RouterOptions,
): Promise<BasicPermission[]> {
  const { logger } = options;
  const permissions: BasicPermission[] = [];

  try {
    const token = await getTokenFromApi(options);

    const [rosData, costClusters, costProjects] = await Promise.allSettled([
      options.optimizationApi
        .getRecommendationList(
          { query: { limit: -1, orderHow: 'desc', orderBy: 'last_reported' } },
          { token },
        )
        .then(r => r.json()),
      options.costManagementApi
        .searchOpenShiftClusters('', { token, limit: 1000 })
        .then(r => r.json()),
      options.costManagementApi
        .searchOpenShiftProjects('', { token, limit: 1000 })
        .then(r => r.json()),
    ]);

    const rosClusterNames = new Set<string>();
    const rosProjects = new Set<string>();

    if (rosData.status === 'fulfilled' && rosData.value?.data) {
      for (const rec of rosData.value.data) {
        if (rec.clusterAlias) rosClusterNames.add(rec.clusterAlias);
        if (rec.project) rosProjects.add(rec.project);
      }
    }

    for (const cluster of rosClusterNames) {
      permissions.push(rosClusterSpecificPermission(cluster));
      for (const project of rosProjects) {
        permissions.push(rosClusterProjectPermission(cluster, project));
      }
    }

    const costClusterNames = new Set<string>();
    const costProjectNames = new Set<string>();

    if (costClusters.status === 'fulfilled' && costClusters.value?.data) {
      for (const c of costClusters.value.data as {
        cluster_alias: string;
      }[]) {
        if (c.cluster_alias) costClusterNames.add(c.cluster_alias);
      }
    }
    if (costProjects.status === 'fulfilled' && costProjects.value?.data) {
      for (const p of costProjects.value.data as { value: string }[]) {
        if (p.value) costProjectNames.add(p.value);
      }
    }

    for (const cluster of costClusterNames) {
      permissions.push(costClusterSpecificPermission(cluster));
      for (const project of costProjectNames) {
        permissions.push(costClusterProjectPermission(cluster, project));
      }
    }

    logger.info(
      `Registered ${permissions.length} dynamic RBAC permissions ` +
        `(${rosClusterNames.size} ROS clusters, ${costClusterNames.size} cost clusters)`,
    );
  } catch (error) {
    logger.warn(
      'Could not fetch cluster/project data for dynamic permission registration. ' +
        'Cluster-specific RBAC permissions will not be evaluated until the next refresh.',
      error instanceof Error ? { error: error.message } : {},
    );
  }

  return permissions;
}

/** @public */
export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const router = Router();

  const dynamicPermissions = await fetchDynamicPermissions(options);

  const permissionsIntegrationRouter = createPermissionIntegrationRouter({
    permissions: [
      ...rosPluginPermissions,
      ...rosApplyPermissions,
      ...costPluginPermissions,
      ...dynamicPermissions,
    ],
  });

  router.use(express.json());
  router.use(permissionsIntegrationRouter);

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  router.get('/access', getAccess(options));

  router.get('/access/cost-management', getCostManagementAccess(options));

  router.post('/apply-recommendation', applyRecommendation(options));

  router.get('/proxy/*', secureProxy(options));

  return router;
}
