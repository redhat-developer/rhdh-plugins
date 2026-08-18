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
  BackstageCredentials,
  PermissionsService,
} from '@backstage/backend-plugin-api';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import {
  x2aAdminViewPermission,
  x2aAdminWritePermission,
  x2aUserPermission,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

/**
 * Normalized x2a RBAC flags for a principal (user or service).
 *
 * @public
 */
export interface X2aPermissionFlags {
  isX2AUser: boolean;
  /**
   * True when the principal has admin read, or admin write.
   * Admin write implies the same project listing scope as admin read
   * (HTTP and MCP must stay aligned).
   */
  canViewAll: boolean;
  canWriteAll: boolean;
}

/**
 * Resolves x2a.user, x2a.admin (read), and x2a.admin (write) for the given credentials.
 *
 * Callers enforce read vs write with their own rules (e.g. HTTP user-only vs MCP service tokens).
 *
 * @public
 */
export async function resolveX2aPermissionFlags(options: {
  credentials: BackstageCredentials;
  permissionsSvc: PermissionsService;
}): Promise<X2aPermissionFlags> {
  const { credentials, permissionsSvc } = options;

  const [userResult, viewResult, writeResult] = await Promise.all([
    permissionsSvc.authorize([{ permission: x2aUserPermission }], {
      credentials,
    }),
    permissionsSvc.authorize([{ permission: x2aAdminViewPermission }], {
      credentials,
    }),
    permissionsSvc.authorize([{ permission: x2aAdminWritePermission }], {
      credentials,
    }),
  ]);

  const isX2AUser = userResult[0]?.result === AuthorizeResult.ALLOW;
  const canViewAllRaw = viewResult[0]?.result === AuthorizeResult.ALLOW;
  const canWriteAll = writeResult[0]?.result === AuthorizeResult.ALLOW;
  const canViewAll = canViewAllRaw || canWriteAll;

  return { isX2AUser, canViewAll, canWriteAll };
}
