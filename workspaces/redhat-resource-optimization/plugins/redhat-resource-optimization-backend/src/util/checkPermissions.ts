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
  costClusterProjectPermission,
} from '@red-hat-developer-hub/plugin-redhat-resource-optimization-common/permissions';

/** Permission type for cluster-level access */
export type ClusterPermissionType = 'ros' | 'cost';

export interface ClusterProjectResult {
  cluster: string;
  project: string;
}

export interface CombinedAuthorizationResult {
  /** Clusters authorized via cluster-only permissions (all projects allowed) */
  authorizedClusterIds: string[];
  /** Specific cluster-project combinations authorized */
  authorizedClusterProjects: ClusterProjectResult[];
}

/**
 * Checks if the user has ANY of the given permissions (OR logic).
 * Optimized to use a single batch authorization call instead of multiple parallel calls.
 *
 * @param request - The HTTP request
 * @param anyOfPermissions - Array of permissions to check (user needs at least one)
 * @param permissionsSvc - The permissions service
 * @param httpAuth - The HTTP auth service
 * @returns Authorization response with ALLOW if any permission is granted, DENY otherwise
 */
export const authorize = async (
  request: HttpRequest,
  anyOfPermissions: BasicPermission[],
  permissionsSvc: PermissionsService,
  httpAuth: HttpAuthService,
): Promise<AuthorizePermissionResponse> => {
  const credentials = await httpAuth.credentials(request);

  // Single batch call for all permissions
  const permissionRequests = anyOfPermissions.map(permission => ({
    permission,
  }));
  const decisions = await permissionsSvc.authorize(permissionRequests, {
    credentials,
  });

  // Return ALLOW if any permission is granted
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

/**
 * Filters cluster-project combinations based on cluster+project-specific permissions.
 * @param request - The HTTP request
 * @param permissionsSvc - The permissions service
 * @param httpAuth - The HTTP auth service
 * @param clusterDataMap - Map of clusterName → clusterId
 * @param allProjects - Array of all project names
 * @param permissionType - 'ros' for ros.{clusterName}.{projectName} or 'cost' for cost.{clusterName}.{projectName} (defaults to 'ros')
 * @returns Array of authorized cluster-project combinations
 */
export const filterAuthorizedClusterProjectIds = async (
  request: HttpRequest,
  permissionsSvc: PermissionsService,
  httpAuth: HttpAuthService,
  clusterDataMap: Record<string, string>,
  allProjects: string[],
  permissionType: ClusterPermissionType = 'ros',
): Promise<ClusterProjectResult[]> => {
  const credentials = await httpAuth.credentials(request);
  const allClusterNames: string[] = Object.keys(clusterDataMap);
  const allClusterIds: string[] = Object.values(clusterDataMap);

  // Pre-calculate total combinations for better performance
  const totalCombinations = allClusterNames.length * allProjects.length;

  // Early exit if no combinations to check
  if (totalCombinations === 0) {
    return [];
  }

  // Select the appropriate permission function based on type
  const getClusterProjectPermission =
    permissionType === 'cost'
      ? costClusterProjectPermission
      : rosClusterProjectPermission;

  // Pre-allocate arrays with known size for better memory performance
  const specificClusterProjectRequests: AuthorizePermissionRequest[] =
    new Array(totalCombinations);
  const clusterProjectMap: ClusterProjectResult[] = new Array(
    totalCombinations,
  );

  // Build permission requests and mapping in a single pass
  let idx = 0;
  for (let i = 0; i < allClusterNames.length; i++) {
    const clusterName = allClusterNames[i];
    const clusterId = allClusterIds[i];

    for (let j = 0; j < allProjects.length; j++) {
      const projectName = allProjects[j];

      specificClusterProjectRequests[idx] = {
        permission: getClusterProjectPermission(clusterName, projectName),
      };

      clusterProjectMap[idx] = {
        cluster: clusterId,
        project: projectName,
      };

      idx++;
    }
  }

  // Batch authorize all permissions in a single call
  const decisions = await permissionsSvc.authorize(
    specificClusterProjectRequests,
    {
      credentials,
    },
  );

  // Filter authorized combinations
  const finalResult = clusterProjectMap.filter(
    (_, index) => decisions[index].result === AuthorizeResult.ALLOW,
  );

  return finalResult;
};

/**
 * Combines cluster-only and cluster-project permission checks into a single optimized flow.
 * Uses permission hierarchy where project-level access also grants cluster access.
 *
 * Permission Hierarchy:
 * - cost.{cluster} → grants access to cluster + ALL projects in that cluster
 * - cost.{cluster}.{project} → grants access to cluster + that specific project
 *
 * @param request - The HTTP request
 * @param permissionsSvc - The permissions service
 * @param httpAuth - The HTTP auth service
 * @param clusterDataMap - Map of clusterName → clusterId
 * @param allProjects - Array of all project names
 * @param permissionType - 'ros' or 'cost' permission namespace (defaults to 'ros')
 * @returns Object containing both cluster-level and project-level authorizations
 */
export const filterAuthorizedClustersAndProjects = async (
  request: HttpRequest,
  permissionsSvc: PermissionsService,
  httpAuth: HttpAuthService,
  clusterDataMap: Record<string, string>,
  allProjects: string[],
  permissionType: ClusterPermissionType = 'ros',
): Promise<CombinedAuthorizationResult> => {
  const credentials = await httpAuth.credentials(request);
  const allClusterNames: string[] = Object.keys(clusterDataMap);
  const allClusterIds: string[] = Object.values(clusterDataMap);

  console.log(
    `[DEBUG] filterAuthorizedClustersAndProjects called with permissionType: ${permissionType}`,
  );
  console.log(`[DEBUG] Clusters to check: ${allClusterNames.join(', ')}`);
  console.log(`[DEBUG] Projects to check: ${allProjects.join(', ')}`);

  // Early exit if no data
  if (allClusterNames.length === 0) {
    return {
      authorizedClusterIds: [],
      authorizedClusterProjects: [],
    };
  }

  // Select appropriate permission functions based on type
  const getClusterPermission =
    permissionType === 'cost'
      ? costClusterSpecificPermission
      : rosClusterSpecificPermission;

  const getClusterProjectPermission =
    permissionType === 'cost'
      ? costClusterProjectPermission
      : rosClusterProjectPermission;

  const numClusters = allClusterNames.length;

  // Step 1: Check cluster-level permissions first
  const clusterPermissionRequests: AuthorizePermissionRequest[] =
    allClusterNames.map(clusterName => {
      const perm = getClusterPermission(clusterName);
      console.log(`[DEBUG] Checking cluster permission: ${perm.name}`);
      return { permission: perm };
    });

  const clusterDecisions = await permissionsSvc.authorize(
    clusterPermissionRequests,
    {
      credentials,
    },
  );

  // Track clusters with and without full access
  const clustersWithFullAccess = new Set<string>();
  const clustersWithoutFullAccess: number[] = [];

  for (let i = 0; i < numClusters; i++) {
    const clusterName = allClusterNames[i];
    const clusterId = allClusterIds[i];
    const clusterIdentifier =
      permissionType === 'cost' ? clusterName : clusterId;
    const decision = clusterDecisions[i].result;

    console.log(
      `[DEBUG] Cluster "${clusterName}" (id: ${clusterId}): ${decision}`,
    );

    if (decision === AuthorizeResult.ALLOW) {
      // User has full cluster access
      console.log(
        `[DEBUG] Adding "${clusterIdentifier}" to clustersWithFullAccess`,
      );
      clustersWithFullAccess.add(clusterIdentifier);
    } else {
      // No cluster access - will need to check project-level permissions
      console.log(
        `[DEBUG] Adding cluster index ${i} to clustersWithoutFullAccess`,
      );
      clustersWithoutFullAccess.push(i);
    }
  }

  console.log(
    `[DEBUG] Clusters with full access: ${Array.from(
      clustersWithFullAccess,
    ).join(', ')}`,
  );
  console.log(
    `[DEBUG] Clusters without full access (count): ${clustersWithoutFullAccess.length}`,
  );

  // Step 2: Check project-level permissions only for clusters without full access
  const authorizedClusterProjects: ClusterProjectResult[] = [];
  const clustersGrantedViaProjects = new Set<string>();

  if (clustersWithoutFullAccess.length > 0 && allProjects.length > 0) {
    console.log(
      `[DEBUG] Checking project-level permissions for ${clustersWithoutFullAccess.length} clusters`,
    );
    const numProjectChecks =
      clustersWithoutFullAccess.length * allProjects.length;
    const projectPermissionRequests: AuthorizePermissionRequest[] = new Array(
      numProjectChecks,
    );
    const projectPermissionMap: ClusterProjectResult[] = new Array(
      numProjectChecks,
    );

    // Build requests only for clusters that don't have full access
    let idx = 0;
    for (const clusterIdx of clustersWithoutFullAccess) {
      const clusterName = allClusterNames[clusterIdx];
      const clusterId = allClusterIds[clusterIdx];
      const clusterIdentifier =
        permissionType === 'cost' ? clusterName : clusterId;

      console.log(
        `[DEBUG] Building project checks for cluster "${clusterName}"`,
      );

      for (let j = 0; j < allProjects.length; j++) {
        const projectName = allProjects[j];
        const perm = getClusterProjectPermission(clusterName, projectName);

        console.log(`[DEBUG] Will check: ${perm.name}`);

        projectPermissionRequests[idx] = {
          permission: perm,
        };

        projectPermissionMap[idx] = {
          cluster: clusterIdentifier,
          project: projectName,
        };

        idx++;
      }
    }

    // Batch check project-level permissions
    const projectDecisions = await permissionsSvc.authorize(
      projectPermissionRequests,
      { credentials },
    );

    // Process project-level results
    for (let i = 0; i < projectDecisions.length; i++) {
      const decision = projectDecisions[i].result;
      const map = projectPermissionMap[i];

      console.log(
        `[DEBUG] Project permission "${map.cluster}.${map.project}": ${decision}`,
      );

      if (decision === AuthorizeResult.ALLOW) {
        const result = projectPermissionMap[i];
        authorizedClusterProjects.push(result);
        console.log(
          `[DEBUG] Adding cluster "${result.cluster}" to clustersGrantedViaProjects`,
        );
        // Project-level permission also grants cluster access
        clustersGrantedViaProjects.add(result.cluster);
      }
    }
  }

  console.log(
    `[DEBUG] Clusters granted via projects: ${Array.from(
      clustersGrantedViaProjects,
    ).join(', ')}`,
  );

  // Step 3: Combine clusters from both full access and project-level grants
  const authorizedClusterIds = [
    ...clustersWithFullAccess,
    ...clustersGrantedViaProjects,
  ];

  console.log(
    `[DEBUG] Final authorized clusters: ${authorizedClusterIds.join(', ')}`,
  );
  console.log(
    `[DEBUG] Final authorized cluster-projects: ${authorizedClusterProjects
      .map(cp => `${cp.cluster}.${cp.project}`)
      .join(', ')}`,
  );

  return {
    authorizedClusterIds,
    authorizedClusterProjects,
  };
};
