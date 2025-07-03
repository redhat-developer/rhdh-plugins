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
  filterAuthorizedClusterIds,
} from '../util/checkPermissions';
import { rosPluginPermissions } from '@red-hat-developer-hub/plugin-redhat-resource-optimization-common/permissions';
import { getTokenFromApi } from '../util/tokenUtil';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { deepMapKeys } from '@red-hat-developer-hub/plugin-redhat-resource-optimization-common/json-utils';
import camelCase from 'lodash/camelCase';
import { RecommendationList } from '@red-hat-developer-hub/plugin-redhat-resource-optimization-common';

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

    // RBAC Filtering logic for Cluster
    const ALL_CLUSTERS_MAP_CACHE_KEY = 'all_clusters_map';
    let clusterDataMap: Record<string, string> = {};

    // Check the cluster data in the cache first
    const clusterMapDataFromCache = (await cache.get(
      ALL_CLUSTERS_MAP_CACHE_KEY,
    )) as Record<string, string> | undefined;
    if (clusterMapDataFromCache) {
      clusterDataMap = clusterMapDataFromCache;
    } else {
      // token
      const token = await getTokenFromApi(options);

      // hit /recommendation API endpoint
      const optimizationResponse = await optimizationApi.getRecommendationList(
        {
          query: {
            limit: -1,
            orderHow: 'desc',
            orderBy: 'last_reported',
          },
        },
        { token },
      );

      if (optimizationResponse.ok) {
        const data = await optimizationResponse.json();
        const camelCaseTransformedResponse = deepMapKeys(
          data,
          camelCase as (value: string | number) => string,
        ) as RecommendationList;

        // retrive cluster data from the API result
        if (camelCaseTransformedResponse.data) {
          camelCaseTransformedResponse.data.map(recommendation => {
            if (recommendation.clusterAlias && recommendation.clusterUuid)
              clusterDataMap[recommendation.clusterAlias] =
                recommendation.clusterUuid;
          });

          // store it in Cache
          await cache.set(ALL_CLUSTERS_MAP_CACHE_KEY, clusterDataMap, {
            ttl: 15 * 60 * 1000,
          });
        }
      } else {
        throw new Error(optimizationResponse.statusText);
      }
    }

    const authorizeClusterIds: string[] = await filterAuthorizedClusterIds(
      _,
      permissions,
      httpAuth,
      clusterDataMap,
    );

    if (authorizeClusterIds.length > 0) {
      finalDecision = AuthorizeResult.ALLOW;
    } else {
      finalDecision = AuthorizeResult.DENY;
    }

    const body = {
      decision: finalDecision,
      authorizeClusterIds,
    };

    return response.json(body);
  };
