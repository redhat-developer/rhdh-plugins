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
  AuthorizePermissionResponse,
  AuthorizeResult,
  BasicPermission,
} from '@backstage/plugin-permission-common';
import {
  Job,
  x2aAdminViewPermission,
  x2aAdminWritePermission,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

const isUserOfAdminViewPermission = async (
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

const isUserOfAdminWritePermission = async (
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

const authorize = async (
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
 * Safely extracts user reference from credentials with fallback
 */
function getUserRef(
  credentials: BackstageCredentials<BackstageUserPrincipal>,
): string {
  try {
    return credentials.principal.userEntityRef;
  } catch {
    return 'user:default/system';
  }
}

type UnsecureJob = Job & { callbackToken?: string };
const removeSensitiveFromJob = (job?: UnsecureJob): Job | undefined => {
  if (!job) {
    return undefined;
  }

  const newJob: UnsecureJob = { ...job };
  delete newJob.callbackToken;
  return newJob;
};

export {
  isUserOfAdminViewPermission,
  isUserOfAdminWritePermission,
  authorize,
  getUserRef,
  removeSensitiveFromJob,
};
