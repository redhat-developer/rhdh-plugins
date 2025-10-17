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
import {
  configApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { policyEntityCreatePermission } from '@backstage-community/plugin-rbac-common';
import { useAsync } from 'react-use';
import { UserRole } from '../types';

/**
 * Determines the user's role for quickstart functionality based on RBAC permissions and user authorization.
 *
 * Business Logic:
 * - Guest user(unauthorized): show admin items
 * - Authorized user + NO RBAC enabled: show admin items
 * - Authorized user + RBAC enabled:
 *   - if user has admin permission => show configured admin items
 *   - if user doesn't have admin permission => show configured developer items
 *
 * @returns Object with isLoading boolean and userRole ('admin' | 'developer' | null)
 */
export const useQuickstartRole = (): {
  isLoading: boolean;
  userRole: UserRole | null;
} => {
  const config = useApi(configApiRef);
  const identityApi = useApi(identityApiRef);
  const isRBACEnabled =
    config.getOptionalBoolean('permission.enabled') ?? false;
  const { loading, allowed } = usePermission({
    permission: policyEntityCreatePermission,
  });

  // Check user authorization status by examining identity and credentials
  const { value: authResult, loading: authLoading } = useAsync(async () => {
    try {
      const credentials = await identityApi.getCredentials();
      const identity = await identityApi.getBackstageIdentity();

      // Check multiple indicators to determine if user is authenticated (not a guest)
      const hasValidToken = credentials?.token && credentials.token.length > 10; // Real tokens are longer
      const userEntityRef = identity?.userEntityRef || '';
      const ownershipRefs = identity?.ownershipEntityRefs || [];

      const isGuest =
        userEntityRef.toLowerCase().includes('guest') ||
        userEntityRef === 'user:default/guest' ||
        (!hasValidToken && ownershipRefs.length === 0);

      const isAuthenticated = !isGuest;

      return { isAuthenticated, identity, credentials };
    } catch (error) {
      return { isAuthenticated: false, identity: null, credentials: null };
    }
  }, [identityApi]);

  // When auth is still resolving, return loading
  if (authLoading) return { isLoading: true, userRole: null };

  // If permission is still loading, report loading
  if (loading) return { isLoading: true, userRole: null };

  // Check if user is authorized (authenticated, not a guest)
  const isUserAuthorized = authResult?.isAuthenticated ?? false;

  // Unauthorized user: show admin items
  if (!isUserAuthorized) {
    return { isLoading: false, userRole: 'admin' };
  }

  // Authorized user + NO RBAC enabled: show admin items
  if (!isRBACEnabled) {
    return { isLoading: false, userRole: 'admin' };
  }

  // Authorized user + RBAC enabled: check permissions
  // If user has admin permission => show configured admin items
  if (allowed) {
    return { isLoading: false, userRole: 'admin' };
  }

  // If user doesn't have admin permission => show configured developer items
  return { isLoading: false, userRole: 'developer' };
};
