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

interface CacheConfig {
  clusterKey: string;
  projectKey: string;
}

type DataFetcher = (
  options: RouterOptions,
) => Promise<{ clusters: Record<string, string>; projects: string[] } | null>;

/**
 * Common RBAC resolution: check plugin-level permission, fetch + cache
 * cluster/project data, filter authorised entries, and return the result.
 */
async function resolveAccessForSection(
  req: Request,
  options: RouterOptions,
  pluginPerms: typeof rosPluginPermissions,
  filterStyle: AccessResult['filterStyle'],
  cacheKeys: CacheConfig,
  fetchData: DataFetcher,
): Promise<AccessResult> {
  const { permissions, httpAuth, cache } = options;
  const deny = (): AccessResult => ({
    decision: 'DENY',
    clusterFilters: [],
    projectFilters: [],
    filterStyle,
  });

  const pluginDecision = await authorize(
    req,
    pluginPerms,
    permissions,
    httpAuth,
  );
  if (pluginDecision.result === AuthorizeResult.ALLOW) {
    return {
      decision: 'ALLOW',
      clusterFilters: [],
      projectFilters: [],
      filterStyle,
    };
  }

  let clusterDataMap: Record<string, string> = {};
  let allProjects: string[] = [];

  const cachedClusters = (await cache.get(cacheKeys.clusterKey)) as
    | Record<string, string>
    | undefined;
  const cachedProjects = (await cache.get(cacheKeys.projectKey)) as
    | string[]
    | undefined;

  if (cachedClusters && cachedProjects) {
    clusterDataMap = cachedClusters;
    allProjects = cachedProjects;
  } else {
    const result = await fetchData(options);
    if (!result) return deny();

    clusterDataMap = result.clusters;
    allProjects = result.projects;

    await Promise.all([
      cache.set(cacheKeys.clusterKey, clusterDataMap, { ttl: CACHE_TTL }),
      cache.set(cacheKeys.projectKey, allProjects, { ttl: CACHE_TTL }),
    ]);
  }

  const { authorizedClusterIds, authorizedClusterProjects } =
    await filterAuthorizedClustersAndProjects(
      req,
      permissions,
      httpAuth,
      clusterDataMap,
      allProjects,
      ...(filterStyle === 'cost' ? (['cost'] as const) : []),
    );

  const finalClusters = [
    ...new Set([
      ...authorizedClusterIds,
      ...authorizedClusterProjects.map(r => r.cluster),
    ]),
  ];
  const finalProjects = authorizedClusterProjects.map(r => r.project);

  if (finalClusters.length === 0) return deny();

  return {
    decision: 'ALLOW',
    clusterFilters: finalClusters,
    projectFilters: finalProjects,
    filterStyle,
  };
}

async function resolveOptimizationsAccess(
  req: Request,
  options: RouterOptions,
): Promise<AccessResult> {
  return resolveAccessForSection(
    req,
    options,
    rosPluginPermissions,
    'ros',
    { clusterKey: 'all_clusters_map', projectKey: 'all_projects' },
    async opts => {
      const token = await getTokenFromApi(opts);
      const response = await opts.optimizationApi.getRecommendationList(
        { query: { limit: -1, orderHow: 'desc', orderBy: 'last_reported' } },
        { token },
      );
      const list = await response.json();

      if ((list as any).errors || !list.data) return null;

      const clusters: Record<string, string> = {};
      list.data.forEach(r => {
        if (r.clusterAlias && r.clusterUuid) {
          clusters[r.clusterAlias] = r.clusterUuid;
        }
      });
      const projects = [...new Set(list.data.map(r => r.project))].filter(
        (p): p is string => p !== undefined,
      );

      return { clusters, projects };
    },
  );
}

async function resolveCostManagementAccess(
  req: Request,
  options: RouterOptions,
): Promise<AccessResult> {
  return resolveAccessForSection(
    req,
    options,
    costPluginPermissions,
    'cost',
    { clusterKey: 'cost_clusters', projectKey: 'cost_projects' },
    async opts => {
      const token = await getTokenFromApi(opts);
      const [clustersResp, projectsResp] = await Promise.all([
        opts.costManagementApi.searchOpenShiftClusters('', {
          token,
          limit: 1000,
        }),
        opts.costManagementApi.searchOpenShiftProjects('', {
          token,
          limit: 1000,
        }),
      ]);

      const clustersData = await clustersResp.json();
      const projectsData = await projectsResp.json();

      const clusters: Record<string, string> = {};
      clustersData.data?.forEach(
        (c: { value: string; cluster_alias: string }) => {
          if (c.cluster_alias && c.value) clusters[c.cluster_alias] = c.value;
        },
      );
      const projects = [
        ...new Set(projectsData.data?.map((p: { value: string }) => p.value)),
      ].filter((p): p is string => p !== undefined);

      return { clusters, projects };
    },
  );
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

    if (/(?:^|\/)\.\.(\/|$)/.test(proxyPath) || proxyPath.startsWith('/')) {
      return res
        .status(400)
        .json({ error: 'Invalid proxy path: traversal not allowed' });
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
      const basePath = `${targetBase}/cost-management/v1/`;
      const targetUrl = new URL(proxyPath, basePath);

      if (!targetUrl.pathname.startsWith(new URL(basePath).pathname)) {
        return res
          .status(400)
          .json({ error: 'Invalid proxy path: traversal not allowed' });
      }

      // Express qs parser converts bracket keys like filter[time_scope_value]
      // into nested objects, losing the flat key format the RHCC API expects.
      // Decode each param before matching so percent-encoded variants of
      // RBAC-controlled keys (e.g. filter%5Bexact%3Acluster%5D) are also caught.
      const rbacControlledKeys = new Set(
        access.filterStyle === 'ros'
          ? ['cluster', 'project']
          : ['filter[exact:cluster]', 'filter[exact:project]'],
      );

      const rawQuery = req.originalUrl.split('?')[1] || '';
      const rawParams = rawQuery.split('&').filter(p => p.length > 0);

      for (const param of rawParams) {
        const eqIdx = param.indexOf('=');
        const rawKey = eqIdx >= 0 ? param.substring(0, eqIdx) : param;
        const rawVal = eqIdx >= 0 ? param.substring(eqIdx + 1) : '';
        const decodedKey = decodeURIComponent(rawKey);

        if (!rbacControlledKeys.has(decodedKey)) {
          targetUrl.searchParams.append(decodedKey, decodeURIComponent(rawVal));
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
        method: 'GET',
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
