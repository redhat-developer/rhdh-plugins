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

import type { Request } from 'express';
import type {
  BackstageCredentials,
  BackstageUserPrincipal,
  HttpAuthService,
  PermissionsService,
} from '@backstage/backend-plugin-api';
import {
  AuthorizePermissionRequest,
  AuthorizePermissionResponse,
  AuthorizeResult,
  BasicPermission,
} from '@backstage/plugin-permission-common';
import {
  Job,
  Project,
  x2aAdminViewPermission,
  x2aAdminWritePermission,
  x2aUserPermission,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { NotAllowedError, NotFoundError } from '@backstage/errors';
import {
  getUserRef,
  getGroupsOfUser,
  reconcileJobStatus,
  generateCallbackToken,
} from '@red-hat-developer-hub/backstage-plugin-x2a-node';

import type { RouterDeps } from './types';

export {
  getUserRef,
  getGroupsOfUser,
  reconcileJobStatus,
  generateCallbackToken,
};

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
 * @public
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
 * @public
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
 * @public
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
 * @public
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
 * @public
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

export type UnsecureJob = Job & { callbackToken?: string };
export const removeSensitiveFromJob = (job?: UnsecureJob): Job | undefined => {
  if (!job) {
    return undefined;
  }

  const newJob: UnsecureJob = { ...job };
  delete newJob.callbackToken;
  return newJob;
};
