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

import { Request as HttpRequest } from 'express-serve-static-core';
import {
  AuthorizePermissionRequest,
  AuthorizePermissionResponse,
  AuthorizeResult,
  BasicPermission,
} from '@backstage/plugin-permission-common';
import {
  PermissionsService,
  HttpAuthService,
} from '@backstage/backend-plugin-api';
import {
  rosClusterProjectPermission,
  rosClusterSpecificPermission,
  costClusterSpecificPermission,
} from '@red-hat-developer-hub/plugin-redhat-resource-optimization-common/permissions';

/** Permission type for cluster-level access */
export type ClusterPermissionType = 'ros' | 'cost';

export interface ClusterProjectResult {
  cluster: string;
  project: string;
}

export const authorize = async (
  request: HttpRequest,
  anyOfPermissions: BasicPermission[],
  permissionsSvc: PermissionsService,
  httpAuth: HttpAuthService,
): Promise<AuthorizePermissionResponse> => {
  const credentials = await httpAuth.credentials(request);

  const decisionResponses: AuthorizePermissionResponse[][] = await Promise.all(
    anyOfPermissions.map(permission =>
      permissionsSvc.authorize([{ permission }], {
        credentials,
      }),
    ),
  );

  const decisions: AuthorizePermissionResponse[] = decisionResponses.map(
    d => d[0],
  );

  const allow = decisions.find(d => d.result === AuthorizeResult.ALLOW);
  return (
    allow || {
      result: AuthorizeResult.DENY,
    }
  );
};

/**
 * Filters cluster IDs based on cluster-specific permissions.
 * @param request - The HTTP request
 * @param permissionsSvc - The permissions service
 * @param httpAuth - The HTTP auth service
 * @param clusterDataMap - Map of clusterName → clusterId
 * @param permissionType - 'ros' for ros.{clusterName} or 'cost' for cost.{clusterName} (defaults to 'ros')
 * @returns Array of authorized cluster IDs
 */
export const filterAuthorizedClusterIds = async (
  request: HttpRequest,
  permissionsSvc: PermissionsService,
  httpAuth: HttpAuthService,
  clusterDataMap: Record<string, string>,
  permissionType: ClusterPermissionType = 'ros',
): Promise<string[]> => {
  const credentials = await httpAuth.credentials(request);
  const allClusterNames: string[] = Object.keys(clusterDataMap);

  // Select the appropriate permission function based on type
  const getClusterPermission =
    permissionType === 'cost'
      ? costClusterSpecificPermission
      : rosClusterSpecificPermission;

  const specificClusterRequests: AuthorizePermissionRequest[] =
    allClusterNames.map(clusterName => ({
      permission: getClusterPermission(clusterName),
    }));

  const decisions = await permissionsSvc.authorize(specificClusterRequests, {
    credentials,
  });

  const authorizeClusterNames = allClusterNames.filter(
    (_, idx) => decisions[idx].result === AuthorizeResult.ALLOW,
  );

  const authorizedClusterIds = authorizeClusterNames.map(
    clusterName => clusterDataMap[clusterName],
  );

  return permissionType === 'cost'
    ? authorizeClusterNames
    : authorizedClusterIds;
};

export const filterAuthorizedClusterProjectIds = async (
  request: HttpRequest,
  permissionsSvc: PermissionsService,
  httpAuth: HttpAuthService,
  clusterDataMap: Record<string, string>,
  allProjects: string[],
): Promise<ClusterProjectResult[]> => {
  const credentials = await httpAuth.credentials(request);
  const allClusterNames: string[] = Object.keys(clusterDataMap);
  const allClusterIds: string[] = Object.values(clusterDataMap);

  const specificClusterProjectRequests: AuthorizePermissionRequest[] = [];
  const clusterProjectMap: ClusterProjectResult[] = [];

  for (let i = 0; i < allClusterNames.length; i++) {
    for (let j = 0; j < allProjects.length; j++) {
      specificClusterProjectRequests.push({
        permission: rosClusterProjectPermission(
          allClusterNames[i],
          allProjects[j],
        ),
      });

      clusterProjectMap.push({
        cluster: allClusterIds[i],
        project: allProjects[j],
      });
    }
  }

  const decisions = await permissionsSvc.authorize(
    specificClusterProjectRequests,
    {
      credentials,
    },
  );

  const finalResult = clusterProjectMap.filter(
    (_, idx) => decisions[idx].result === AuthorizeResult.ALLOW,
  );

  return finalResult;
};
