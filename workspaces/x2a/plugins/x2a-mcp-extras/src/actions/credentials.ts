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
import type {
  AuthService,
  BackstageCredentials,
  BackstageUserPrincipal,
  PermissionsService,
} from '@backstage/backend-plugin-api';
import type { CatalogService } from '@backstage/plugin-catalog-node';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { NotAllowedError } from '@backstage/errors';
import {
  x2aAdminViewPermission,
  x2aAdminWritePermission,
  x2aUserPermission,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import {
  getUserRef,
  getGroupsOfUser,
} from '@red-hat-developer-hub/backstage-plugin-x2a-backend';

/**
 * Resolved credential context shared by all MCP tool handlers.
 *
 * With DCR OAuth the credentials carry a real BackstageUserPrincipal;
 * with static tokens they carry a BackstageServicePrincipal. This helper
 * resolves both modes into a uniform shape the downstream DB/service layer
 * can consume.
 */
export interface CredentialsContext {
  /** Credentials cast to the user-principal shape the DB layer expects. */
  credentials: BackstageCredentials<BackstageUserPrincipal>;
  userRef: string;
  groupsOfUser: string[];
  canViewAll: boolean;
  canWriteAll: boolean;
}

export async function resolveCredentialsContext(options: {
  credentials: BackstageCredentials;
  auth: AuthService;
  catalog: CatalogService;
  permissionsSvc: PermissionsService;
  readOnly: boolean;
}): Promise<CredentialsContext> {
  const { credentials, auth, catalog, permissionsSvc, readOnly } = options;

  const isUser = auth.isPrincipal(credentials, 'user');

  const [userResult, viewResult, writeResult] = await Promise.all([
    permissionsSvc.authorize([{ permission: x2aUserPermission }], {
      credentials,
    }),
    permissionsSvc.authorize([{ permission: x2aAdminViewPermission }], {
      credentials,
    }),
    readOnly
      ? Promise.resolve([{ result: AuthorizeResult.DENY }])
      : permissionsSvc.authorize([{ permission: x2aAdminWritePermission }], {
          credentials,
        }),
  ]);

  const isX2AUser = userResult[0]?.result === AuthorizeResult.ALLOW;
  const canViewAll = viewResult[0]?.result === AuthorizeResult.ALLOW;
  const canWriteAll = writeResult[0]?.result === AuthorizeResult.ALLOW;

  if (isUser) {
    if (readOnly && !isX2AUser && !canViewAll) {
      throw new NotAllowedError('The user is not allowed to read projects.');
    }
    if (!readOnly && !isX2AUser && !canWriteAll) {
      throw new NotAllowedError('The user is not allowed to write projects.');
    }

    const userRef = getUserRef(credentials);
    const groupsOfUser = await getGroupsOfUser(userRef, {
      catalog,
      credentials,
    });

    return {
      credentials,
      userRef,
      groupsOfUser,
      canViewAll,
      canWriteAll,
    };
  }

  // Static-token / service-principal fallback
  if (!isX2AUser && !canViewAll && !canWriteAll) {
    throw new NotAllowedError(
      'The MCP service principal is not allowed to access x2a projects. ' +
        'Configure RBAC permissions for the MCP client subject.',
    );
  }

  return {
    // The DB layer is typed for user credentials but getUserRef() safely
    // falls back to 'user:default/system' for non-user principals (means if using static tokens).
    credentials: credentials as BackstageCredentials<BackstageUserPrincipal>,
    userRef: getUserRef(credentials),
    groupsOfUser: [],
    canViewAll: canViewAll || canWriteAll,
    canWriteAll,
  };
}
