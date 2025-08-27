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

import { usePermission } from '@backstage/plugin-permission-react';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { policyEntityCreatePermission } from '@backstage-community/plugin-rbac-common';

/**
 * Determines the user's role for quickstart functionality based on RBAC permissions.
 *
 * Business Logic:
 * - If RBAC is not configured, assume platform engineers (admins) are setting up RHDH
 * - If RBAC is enabled, check permissions to determine admin vs developer role
 *
 * @returns 'admin' if RBAC is disabled or user has required permissions, 'developer' otherwise
 */
export const useQuickstartRole = (): 'admin' | 'developer' => {
  const config = useApi(configApiRef);
  const isRBACEnabled =
    config.getOptionalBoolean('permission.enabled') ?? false;
  const { loading, allowed } = usePermission({
    permission: policyEntityCreatePermission,
  });

  if (!isRBACEnabled) return 'admin';
  if (!loading && allowed) return 'admin';
  return 'developer';
};
