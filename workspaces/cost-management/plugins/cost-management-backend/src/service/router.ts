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

/** @internal Visible for testing */
export function extractStrings<T>(
  result: PromiseSettledResult<{ data?: T[] }>,
  accessor: (item: T) => string | undefined,
): Set<string> {
  const values = new Set<string>();
  if (result.status !== 'fulfilled' || !result.value?.data) {
    return values;
  }
  for (const item of result.value.data) {
    const v = accessor(item);
    if (v) values.add(v);
  }
  return values;
}

/** @internal Visible for testing */
export function buildClusterProjectPermissions(
  clusters: Set<string>,
  projects: Set<string>,
  clusterFn: (cluster: string) => BasicPermission,
  projectFn: (cluster: string, project: string) => BasicPermission,
): BasicPermission[] {
  const perms: BasicPermission[] = [];
  for (const cluster of clusters) {
    perms.push(clusterFn(cluster));
    for (const project of projects) {
      perms.push(projectFn(cluster, project));
    }
  }
  return perms;
}

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

    const rosClusterNames = extractStrings(rosData, r => r.clusterAlias);
    const rosProjectNames = extractStrings(rosData, r => r.project);
    const costClusterNames = extractStrings(
      costClusters,
      (c: { cluster_alias: string }) => c.cluster_alias,
    );
    const costProjectNames = extractStrings(
      costProjects,
      (p: { value: string }) => p.value,
    );

    const permissions = [
      ...buildClusterProjectPermissions(
        rosClusterNames,
        rosProjectNames,
        rosClusterSpecificPermission,
        rosClusterProjectPermission,
      ),
      ...buildClusterProjectPermissions(
        costClusterNames,
        costProjectNames,
        costClusterSpecificPermission,
        costClusterProjectPermission,
      ),
    ];

    logger.info(
      `Registered ${permissions.length} dynamic RBAC permissions ` +
        `(${rosClusterNames.size} ROS clusters, ${costClusterNames.size} cost clusters)`,
    );

    return permissions;
  } catch (error) {
    logger.warn(
      'Could not fetch cluster/project data for dynamic permission registration. ' +
        'Cluster-specific RBAC permissions will not be evaluated until the next refresh.',
      error instanceof Error ? { error: error.message } : {},
    );
    return [];
  }
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
