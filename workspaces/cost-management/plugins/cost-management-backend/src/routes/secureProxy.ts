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

import type { RequestHandler, Request } from 'express';
import type { RouterOptions } from '../models/RouterOptions';
import {
  authorize,
  filterAuthorizedClustersAndProjects,
} from '../util/checkPermissions';
import {
  rosPluginPermissions,
  costPluginPermissions,
} from '@red-hat-developer-hub/plugin-cost-management-common/permissions';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { getTokenFromApi } from '../util/tokenUtil';
import { DEFAULT_COST_MANAGEMENT_PROXY_BASE_URL } from '../util/constant';

const CACHE_TTL = 15 * 60 * 1000;

interface AccessResult {
  decision: string;
  clusterFilters: string[];
  projectFilters: string[];
  filterStyle: 'ros' | 'cost';
}

/**
 * Determines the RBAC scope for a given proxy path and resolves
 * the authorized cluster/project filters server-side.
 */
async function resolveAccess(
  req: Request,
  proxyPath: string,
  options: RouterOptions,
): Promise<AccessResult> {
  const isOptimizations = proxyPath.startsWith('recommendations/');

  if (isOptimizations) {
    return resolveOptimizationsAccess(req, options);
  }
  return resolveCostManagementAccess(req, options);
}

async function resolveOptimizationsAccess(
  req: Request,
  options: RouterOptions,
): Promise<AccessResult> {
  const { permissions, httpAuth, cache, optimizationApi } = options;

  const pluginDecision = await authorize(
    req,
    rosPluginPermissions,
    permissions,
    httpAuth,
  );
  if (pluginDecision.result === AuthorizeResult.ALLOW) {
    return {
      decision: 'ALLOW',
      clusterFilters: [],
      projectFilters: [],
      filterStyle: 'ros',
    };
  }

  const ALL_CLUSTERS_MAP_CACHE_KEY = 'all_clusters_map';
  const ALL_PROJECTS_CACHE_KEY = 'all_projects';

  let clusterDataMap: Record<string, string> = {};
  let allProjects: string[] = [];

  const clusterMapDataFromCache = (await cache.get(
    ALL_CLUSTERS_MAP_CACHE_KEY,
  )) as Record<string, string> | undefined;
  const projectDataFromCache = (await cache.get(ALL_PROJECTS_CACHE_KEY)) as
    | string[]
    | undefined;

  if (clusterMapDataFromCache && projectDataFromCache) {
    clusterDataMap = clusterMapDataFromCache;
    allProjects = projectDataFromCache;
  } else {
    const token = await getTokenFromApi(options);
    const optimizationResponse = await optimizationApi.getRecommendationList(
      { query: { limit: -1, orderHow: 'desc', orderBy: 'last_reported' } },
      { token },
    );
    const recommendationList = await optimizationResponse.json();

    if ((recommendationList as any).errors) {
      return {
        decision: 'DENY',
        clusterFilters: [],
        projectFilters: [],
        filterStyle: 'ros',
      };
    }

    if (recommendationList.data) {
      recommendationList.data.forEach(recommendation => {
        if (recommendation.clusterAlias && recommendation.clusterUuid) {
          clusterDataMap[recommendation.clusterAlias] =
            recommendation.clusterUuid;
        }
      });
      allProjects = [
        ...new Set(recommendationList.data.map(r => r.project)),
      ].filter(p => p !== undefined) as string[];

      await cache.set(ALL_CLUSTERS_MAP_CACHE_KEY, clusterDataMap, {
        ttl: CACHE_TTL,
      });
      await cache.set(ALL_PROJECTS_CACHE_KEY, allProjects, { ttl: CACHE_TTL });
    }
  }

  const { authorizedClusterIds, authorizedClusterProjects } =
    await filterAuthorizedClustersAndProjects(
      req,
      permissions,
      httpAuth,
      clusterDataMap,
      allProjects,
    );

  const finalClusterIds = [
    ...new Set([
      ...authorizedClusterIds,
      ...authorizedClusterProjects.map(r => r.cluster),
    ]),
  ];
  const finalProjects = authorizedClusterProjects.map(r => r.project);

  if (finalClusterIds.length === 0) {
    return {
      decision: 'DENY',
      clusterFilters: [],
      projectFilters: [],
      filterStyle: 'ros',
    };
  }

  return {
    decision: 'ALLOW',
    clusterFilters: finalClusterIds,
    projectFilters: finalProjects,
    filterStyle: 'ros',
  };
}

async function resolveCostManagementAccess(
  req: Request,
  options: RouterOptions,
): Promise<AccessResult> {
  const { permissions, httpAuth, cache, costManagementApi } = options;

  const pluginDecision = await authorize(
    req,
    costPluginPermissions,
    permissions,
    httpAuth,
  );
  if (pluginDecision.result === AuthorizeResult.ALLOW) {
    return {
      decision: 'ALLOW',
      clusterFilters: [],
      projectFilters: [],
      filterStyle: 'cost',
    };
  }

  const COST_CLUSTERS_CACHE_KEY = 'cost_clusters';
  const COST_PROJECTS_CACHE_KEY = 'cost_projects';

  let clusterDataMap: Record<string, string> = {};
  let allProjects: string[] = [];

  const clustersFromCache = (await cache.get(COST_CLUSTERS_CACHE_KEY)) as
    | Record<string, string>
    | undefined;
  const projectsFromCache = (await cache.get(COST_PROJECTS_CACHE_KEY)) as
    | string[]
    | undefined;

  if (clustersFromCache && projectsFromCache) {
    clusterDataMap = clustersFromCache;
    allProjects = projectsFromCache;
  } else {
    const token = await getTokenFromApi(options);
    const [clustersResponse, projectsResponse] = await Promise.all([
      costManagementApi.searchOpenShiftClusters('', { token, limit: 1000 }),
      costManagementApi.searchOpenShiftProjects('', { token, limit: 1000 }),
    ]);

    const clustersData = await clustersResponse.json();
    const projectsData = await projectsResponse.json();

    clustersData.data?.forEach(
      (cluster: { value: string; cluster_alias: string }) => {
        if (cluster.cluster_alias && cluster.value) {
          clusterDataMap[cluster.cluster_alias] = cluster.value;
        }
      },
    );
    allProjects = [
      ...new Set(
        projectsData.data?.map((project: { value: string }) => project.value),
      ),
    ].filter(p => p !== undefined) as string[];

    await Promise.all([
      cache.set(COST_CLUSTERS_CACHE_KEY, clusterDataMap, { ttl: CACHE_TTL }),
      cache.set(COST_PROJECTS_CACHE_KEY, allProjects, { ttl: CACHE_TTL }),
    ]);
  }

  const { authorizedClusterIds, authorizedClusterProjects } =
    await filterAuthorizedClustersAndProjects(
      req,
      permissions,
      httpAuth,
      clusterDataMap,
      allProjects,
      'cost',
    );

  const finalClusterNames = [
    ...new Set([
      ...authorizedClusterIds,
      ...authorizedClusterProjects.map(r => r.cluster),
    ]),
  ];
  const finalProjects = authorizedClusterProjects.map(r => r.project);

  if (finalClusterNames.length === 0) {
    return {
      decision: 'DENY',
      clusterFilters: [],
      projectFilters: [],
      filterStyle: 'cost',
    };
  }

  return {
    decision: 'ALLOW',
    clusterFilters: finalClusterNames,
    projectFilters: finalProjects,
    filterStyle: 'cost',
  };
}

/**
 * Server-side proxy that keeps the SSO token on the backend and enforces
 * RBAC before forwarding requests to the Cost Management API.
 *
 * Replaces the previous architecture where the frontend received the SSO
 * token via GET /token and called the Backstage proxy directly.
 */
export const secureProxy: (options: RouterOptions) => RequestHandler =
  options => async (req, res) => {
    const { logger, config } = options;
    const proxyPath = req.params[0];

    if (!proxyPath) {
      return res.status(400).json({ error: 'Missing proxy path' });
    }

    try {
      const access = await resolveAccess(req, proxyPath, options);

      if (access.decision !== 'ALLOW') {
        return res.status(403).json({ error: 'Access denied by RBAC policy' });
      }

      const token = await getTokenFromApi(options);

      const targetBase =
        config?.getOptionalString('costManagementProxyBaseUrl') ??
        DEFAULT_COST_MANAGEMENT_PROXY_BASE_URL;
      const targetUrl = new URL(
        `${targetBase}/cost-management/v1/${proxyPath}`,
      );

      // Express qs parser converts bracket keys like filter[time_scope_value]
      // into nested objects, losing the flat key format the RHCC API expects.
      // Use the raw query string to preserve the original key names.
      const rbacControlledPatterns =
        access.filterStyle === 'ros'
          ? [/^cluster=/m, /^project=/m]
          : [/^filter\[exact:cluster\]=/m, /^filter\[exact:project\]=/m];

      const rawQuery = req.originalUrl.split('?')[1] || '';
      const rawParams = rawQuery.split('&').filter(p => p.length > 0);

      for (const param of rawParams) {
        const shouldStrip = rbacControlledPatterns.some(pattern =>
          pattern.test(param),
        );
        if (!shouldStrip) {
          const eqIdx = param.indexOf('=');
          const key = eqIdx >= 0 ? param.substring(0, eqIdx) : param;
          const val = eqIdx >= 0 ? param.substring(eqIdx + 1) : '';
          targetUrl.searchParams.append(
            decodeURIComponent(key),
            decodeURIComponent(val),
          );
        }
      }

      // Inject server-side RBAC filters (empty arrays = full access, no filter needed)
      if (access.clusterFilters.length > 0) {
        if (access.filterStyle === 'ros') {
          access.clusterFilters.forEach(c =>
            targetUrl.searchParams.append('cluster', c),
          );
        } else {
          access.clusterFilters.forEach(c =>
            targetUrl.searchParams.append('filter[exact:cluster]', c),
          );
        }
      }
      if (access.projectFilters.length > 0) {
        if (access.filterStyle === 'ros') {
          access.projectFilters.forEach(p =>
            targetUrl.searchParams.append('project', p),
          );
        } else {
          access.projectFilters.forEach(p =>
            targetUrl.searchParams.append('filter[exact:project]', p),
          );
        }
      }

      logger.info(
        `Proxying ${req.method} to ${targetUrl.pathname}${targetUrl.search}`,
      );

      const acceptHeader = req.headers.accept || 'application/json';

      const upstreamResponse = await fetch(targetUrl.toString(), {
        headers: {
          'Content-Type': 'application/json',
          Accept: acceptHeader,
          Authorization: `Bearer ${token}`,
        },
        method: req.method,
      });

      const contentType = upstreamResponse.headers.get('content-type') || '';

      res.status(upstreamResponse.status);

      if (contentType.includes('application/json')) {
        const data = await upstreamResponse.json();
        return res.json(data);
      }

      const text = await upstreamResponse.text();
      res.set('Content-Type', contentType);
      return res.send(text);
    } catch (error) {
      logger.error('Secure proxy error', error);
      return res.status(500).json({ error: 'Internal proxy error' });
    }
  };
