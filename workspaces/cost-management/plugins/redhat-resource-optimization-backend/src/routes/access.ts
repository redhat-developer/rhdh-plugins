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

import type { RequestHandler } from 'express';
import type { RouterOptions } from '../models/RouterOptions';
import {
  authorize,
  filterAuthorizedClustersAndProjects,
} from '../util/checkPermissions';
import { rosPluginPermissions } from '@red-hat-developer-hub/plugin-redhat-resource-optimization-common/permissions';
import { getTokenFromApi } from '../util/tokenUtil';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

export const getAccess: (options: RouterOptions) => RequestHandler =
  options => async (_, response) => {
    const { logger, permissions, httpAuth, cache, optimizationApi } = options;
    let finalDecision = AuthorizeResult.DENY;

    // Check for ros.plugin permisssion
    // if user has ros.plugin permission, allow access to all the data
    const rosPluginDecision = await authorize(
      _,
      rosPluginPermissions,
      permissions,
      httpAuth,
    );

    logger.info(`Checking decision:`, rosPluginDecision);

    if (rosPluginDecision.result === AuthorizeResult.ALLOW) {
      finalDecision = AuthorizeResult.ALLOW;

      const body = {
        decision: finalDecision,
        authorizeClusterIds: [],
      };
      return response.json(body);
    }

    // RBAC Filtering logic for Cluster & Project
    const ALL_CLUSTERS_MAP_CACHE_KEY = 'all_clusters_map';
    const ALL_PROJECTS_CACHE_KEY = 'all_projects';

    let clusterDataMap: Record<string, string> = {};
    let allProjects: string[] = [];

    // Check the cluster & project data in the cache first
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
      try {
        // token
        const token = await getTokenFromApi(options);

        // hit /recommendation API endpoint
        const optimizationResponse =
          await optimizationApi.getRecommendationList(
            {
              query: {
                limit: -1,
                orderHow: 'desc',
                orderBy: 'last_reported',
              },
            },
            { token },
          );

        // OptimizationsClient already transforms to camelCase when token is provided
        const recommendationList = await optimizationResponse.json();

        // Check if response contains errors
        if ((recommendationList as any).errors) {
          logger.error(
            'API returned errors:',
            (recommendationList as any).errors,
          );
          return response.status(500).json({
            decision: AuthorizeResult.DENY,
            error: 'API returned errors',
            authorizeClusterIds: [],
            authorizeProjects: [],
          });
        }

        // retrive cluster data from the API result
        if (recommendationList.data) {
          recommendationList.data.map(recommendation => {
            if (recommendation.clusterAlias && recommendation.clusterUuid)
              clusterDataMap[recommendation.clusterAlias] =
                recommendation.clusterUuid;
          });

          allProjects = [
            ...new Set(
              recommendationList.data.map(
                recommendation => recommendation.project,
              ),
            ),
          ].filter(project => project !== undefined) as string[];

          // store it in Cache
          await cache.set(ALL_CLUSTERS_MAP_CACHE_KEY, clusterDataMap, {
            ttl: 15 * 60 * 1000,
          });
          await cache.set(ALL_PROJECTS_CACHE_KEY, allProjects, {
            ttl: 15 * 60 * 1000,
          });
        }
      } catch (error) {
        logger.error('Error fetching recommendations', error);

        // Return unauthorized response on any error
        return response.status(500).json({
          decision: AuthorizeResult.DENY,
          error: 'Failed to fetch cluster data',
          authorizeClusterIds: [],
          authorizeProjects: [],
        });
      }
    }

    // RBAC Filtering: Single batch call for both cluster and cluster-project permissions
    logger.info(
      `Checking permissions for ${
        Object.keys(clusterDataMap).length
      } clusters and ${allProjects.length} projects`,
    );
    logger.info(`Cluster names: ${Object.keys(clusterDataMap).join(', ')}`);
    logger.info(`Projects: ${allProjects.join(', ')}`);

    const { authorizedClusterIds, authorizedClusterProjects } =
      await filterAuthorizedClustersAndProjects(
        _,
        permissions,
        httpAuth,
        clusterDataMap,
        allProjects,
      );

    logger.info(
      `Authorization results: ${authorizedClusterIds.length} cluster IDs, ${authorizedClusterProjects.length} cluster-project combinations`,
    );
    logger.info(`Authorized cluster IDs: ${authorizedClusterIds.join(', ')}`);
    logger.info(
      `Authorized cluster-projects: ${authorizedClusterProjects
        .map(cp => `${cp.cluster}.${cp.project}`)
        .join(', ')}`,
    );

    // Combine cluster IDs from both cluster-level and project-level permissions
    const finalAuthorizedClusterIds = [
      ...new Set([
        ...authorizedClusterIds,
        ...authorizedClusterProjects.map(result => result.cluster),
      ]),
    ];

    const authorizeProjects = authorizedClusterProjects.map(
      result => result.project,
    );

    if (finalAuthorizedClusterIds.length > 0) {
      finalDecision = AuthorizeResult.ALLOW;
    } else {
      finalDecision = AuthorizeResult.DENY;
    }

    const body = {
      decision: finalDecision,
      authorizeClusterIds: finalAuthorizedClusterIds,
      authorizeProjects,
    };

    return response.json(body);
  };
