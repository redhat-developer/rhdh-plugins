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

import crypto from 'node:crypto';
import type { Request } from 'express';
import type {
  BackstageCredentials,
  BackstageUserPrincipal,
  HttpAuthService,
  PermissionsService,
} from '@backstage/backend-plugin-api';
import { RELATION_MEMBER_OF } from '@backstage/catalog-model';
import {
  AuthorizePermissionRequest,
  AuthorizePermissionResponse,
  AuthorizeResult,
  BasicPermission,
} from '@backstage/plugin-permission-common';
import type { CatalogService } from '@backstage/plugin-catalog-node';
import {
  Job,
  Project,
  x2aAdminViewPermission,
  x2aAdminWritePermission,
  x2aUserPermission,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { NotAllowedError, NotFoundError } from '@backstage/errors';

import type { RouterDeps } from './types';

/**
 * Checks if the user has the x2aAdminViewPermission.
 */
export const isUserOfAdminViewPermission = async (
  request: Request,
  permissionsSvc: PermissionsService,
  httpAuth: HttpAuthService,
): Promise<boolean> => {
  const credentials = await httpAuth.credentials(request);
  const result = await permissionsSvc.authorize(
    [{ permission: x2aAdminViewPermission }],
    { credentials },
  );
  return result?.[0]?.result === AuthorizeResult.ALLOW;
};

/**
 * Checks if the user has the x2aAdminWritePermission.
 */
export const isUserOfAdminWritePermission = async (
  request: Request,
  permissionsSvc: PermissionsService,
  httpAuth: HttpAuthService,
): Promise<boolean> => {
  const credentials = await httpAuth.credentials(request);
  const result = await permissionsSvc.authorize(
    [{ permission: x2aAdminWritePermission }],
    { credentials },
  );
  return result?.[0]?.result === AuthorizeResult.ALLOW;
};

/**
 * Checks if the user has the x2aUserPermission.
 */
export const isUserOfX2AUserPermission = async (
  request: Request,
  permissionsSvc: PermissionsService,
  httpAuth: HttpAuthService,
): Promise<boolean> => {
  const credentials = await httpAuth.credentials(request);
  const result = await permissionsSvc.authorize(
    [{ permission: x2aUserPermission }],
    { credentials },
  );
  return result?.[0]?.result === AuthorizeResult.ALLOW;
};

/**
 * Authorizes the user for the given list of permissions.
 */
export const authorize = async (
  request: Request,
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
    d => d?.[0] ?? { result: AuthorizeResult.DENY },
  );
  const allow = decisions.find(d => d.result === AuthorizeResult.ALLOW);
  return (
    allow || {
      result: AuthorizeResult.DENY,
    }
  );
};

/**
 * Enforces the x2a permissions for the given request.
 *
 * Throws a NotAllowedError if the user does not have any of the x2a.user or x2a.admin (read or update, depending on the readOnly param)
 */
export const useEnforceX2APermissions = async ({
  req,
  readOnly,
  permissionsSvc,
  httpAuth,
}: {
  req: Request;
  readOnly: boolean;
} & Pick<RouterDeps, 'permissionsSvc' | 'httpAuth'>): Promise<{
  canViewAll: boolean;
  canWriteAll: boolean;
  credentials: BackstageCredentials<BackstageUserPrincipal>;
}> => {
  const credentials = await httpAuth.credentials(req, { allow: ['user'] });
  const permissionsRequests: AuthorizePermissionRequest[] = [
    { permission: x2aUserPermission },
    { permission: x2aAdminViewPermission },
  ];
  if (!readOnly) {
    permissionsRequests.push({ permission: x2aAdminWritePermission });
  }

  // Future versions should support passing an array of requests to the permissionsSvc.authorize() but this does not work yet.
  const result = await Promise.all(
    permissionsRequests.map(request => {
      return permissionsSvc.authorize([request], {
        credentials,
      });
    }),
  );

  const isX2AUser = result[0][0]?.result === AuthorizeResult.ALLOW;
  const canViewAll = result[1][0]?.result === AuthorizeResult.ALLOW;
  const canWriteAll =
    !readOnly && result[2]?.[0]?.result === AuthorizeResult.ALLOW;

  if (readOnly) {
    if (!isX2AUser && !canViewAll) {
      throw new NotAllowedError('The user is not allowed to read projects.');
    }
  } else if (!isX2AUser && !canWriteAll) {
    throw new NotAllowedError('The user is not allowed to write projects.');
  }

  return {
    canViewAll,
    canWriteAll,
    credentials,
  };
};

/**
 * Enforces the user can view or write the project.
 */
export const useEnforceProjectPermissions = async (
  props: {
    req: Request;
    readOnly: boolean;
    projectId: string;
    doEnrichment?: boolean;
  } & Pick<
    RouterDeps,
    'x2aDatabase' | 'permissionsSvc' | 'httpAuth' | 'catalog'
  >,
): Promise<{
  project: Project;
  userRef: string;
  credentials: BackstageCredentials<BackstageUserPrincipal>;
  groupsOfUser: string[];
  canViewAll: boolean;
  canWriteAll: boolean;
}> => {
  const { canViewAll, canWriteAll, credentials } =
    await useEnforceX2APermissions(props);

  const {
    projectId,
    x2aDatabase,
    readOnly,
    catalog,
    doEnrichment = false,
  } = props;

  const userRef = getUserRef(credentials);
  const groupsOfUser = await getGroupsOfUser(userRef, {
    catalog,
    credentials,
  });
  const project = await x2aDatabase.getProject(
    { projectId, skipEnrichment: !doEnrichment },
    {
      credentials,
      canViewAll: readOnly ? canViewAll : canWriteAll,
      groupsOfUser,
    },
  );
  if (!project) {
    throw new NotFoundError(`Project not found for the "${userRef}" user.`);
  }

  return {
    project,
    userRef,
    groupsOfUser,
    credentials,
    canViewAll,
    canWriteAll,
  };
};

/**
 * Safely extracts user reference from credentials with fallback
 */
export function getUserRef(
  credentials: BackstageCredentials<BackstageUserPrincipal>,
): string {
  try {
    return credentials.principal.userEntityRef;
  } catch {
    return 'user:default/system';
  }
}

/**
 * Returns the list of Backstage group entity refs the user is a member of.
 * Fetches the user entity from the catalog and extracts targetRef from
 * relations of type RELATION_MEMBER_OF.
 * Returns an empty array if the user is not in the catalog or has no group memberships.
 */
export async function getGroupsOfUser(
  userEntityRef: string,
  options: {
    catalog: CatalogService;
    credentials: BackstageCredentials;
  },
): Promise<string[]> {
  try {
    const userEntity = await options.catalog.getEntityByRef(userEntityRef, {
      credentials: options.credentials,
    });

    if (!userEntity?.relations) {
      return [];
    }

    const memberOfRelations =
      userEntity.relations.filter(
        relation => relation.type === RELATION_MEMBER_OF,
      ) ?? [];

    return memberOfRelations.map(relation => relation.targetRef);
  } catch {
    return [];
  }
}

export type UnsecureJob = Job & { callbackToken?: string };
export const removeSensitiveFromJob = (job?: UnsecureJob): Job | undefined => {
  if (!job) {
    return undefined;
  }

  const newJob: UnsecureJob = { ...job };
  delete newJob.callbackToken;
  return newJob;
};

// TODO: Remove once collectArtifacts (or the `report` command) is implemented
// and jobs update their own status on completion. Until then this is the only
// mechanism that syncs stale DB records with actual K8s job state.
export async function reconcileJobStatus(
  job: Job,
  deps: Pick<RouterDeps, 'kubeService' | 'x2aDatabase' | 'logger'>,
): Promise<Job> {
  if (!['pending', 'running'].includes(job.status)) {
    return job;
  }
  if (!job.k8sJobName) {
    return job;
  }

  deps.logger.info(
    `Reconciling job ${job.id} (k8s: ${job.k8sJobName}), DB status: '${job.status}'`,
  );
  const k8sStatus = await deps.kubeService.getJobStatus(job.k8sJobName);

  if (k8sStatus.status === 'success' || k8sStatus.status === 'error') {
    let log: string | null = null;
    try {
      log = (await deps.kubeService.getJobLogs(job.k8sJobName)) as string;
    } catch {
      deps.logger.warn(
        `Could not fetch logs for job ${job.id} (k8s job: ${job.k8sJobName})`,
      );
    }
    const updated = await deps.x2aDatabase.updateJob({
      id: job.id,
      status: k8sStatus.status,
      finishedAt: new Date(),
      log,
    });
    deps.logger.info(
      `Reconciled job ${job.id}: DB had '${job.status}', K8s reports '${k8sStatus.status}'`,
    );
    return updated ?? job;
  }

  return job;
}

/** Generate a 256-bit hex callback token to match HMAC-SHA256 strength. */
export function generateCallbackToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
