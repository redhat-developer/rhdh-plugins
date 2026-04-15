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
import { NotAllowedError } from '@backstage/errors';
import {
  getUserRef,
  getGroupsOfUser,
  resolveX2aPermissionFlags,
} from '@red-hat-developer-hub/backstage-plugin-x2a-node';

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

  const { isX2AUser, canViewAll, canWriteAll } =
    await resolveX2aPermissionFlags({
      credentials,
      permissionsSvc,
    });

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

  // Static-token / service-principal: same read vs write gates as users
  if (readOnly && !isX2AUser && !canViewAll) {
    throw new NotAllowedError(
      'The MCP service principal is not allowed to read x2a projects. ' +
        'Configure RBAC permissions for the MCP client subject.',
    );
  }
  if (!readOnly && !isX2AUser && !canWriteAll) {
    throw new NotAllowedError(
      'The MCP service principal is not allowed to write x2a projects. ' +
        'Configure RBAC permissions for the MCP client subject.',
    );
  }

  return {
    // The DB layer is typed for user credentials but getUserRef() safely
    // falls back to 'user:default/system' for non-user principals (means if using static tokens).
    credentials: credentials as BackstageCredentials<BackstageUserPrincipal>,
    userRef: getUserRef(credentials),
    groupsOfUser: [],
    canViewAll,
    canWriteAll,
  };
}
