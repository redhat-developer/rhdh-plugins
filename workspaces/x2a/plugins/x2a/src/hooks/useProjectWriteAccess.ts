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
import { useCallback } from 'react';
import useAsync from 'react-use/lib/useAsync';

import { identityApiRef, useApi } from '@backstage/core-plugin-api';
import { usePermission } from '@backstage/plugin-permission-react';
import {
  Project,
  x2aAdminWritePermission,
  x2aUserPermission,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

/**
 * Determines whether the current user has write access to a given project.
 *
 * - x2aAdminWritePermission grants write to ALL projects.
 * - x2aUserPermission grants write to projects whose ownedBy matches
 *   the user's entity ref or any of their group memberships.
 */
export const useProjectWriteAccess = () => {
  const identityApi = useApi(identityApiRef);

  const adminWrite = usePermission({ permission: x2aAdminWritePermission });
  const userPerm = usePermission({ permission: x2aUserPermission });

  const { value: identity, loading: identityLoading } = useAsync(
    () => identityApi.getBackstageIdentity(),
    [identityApi],
  );

  const loading = adminWrite.loading || userPerm.loading || identityLoading;
  const hasAnyWriteAccess =
    !loading && (adminWrite.allowed || userPerm.allowed);

  const canWriteProject = useCallback(
    (project: Project): boolean => {
      if (loading) return false;
      if (adminWrite.allowed) return true;
      if (!userPerm.allowed) return false;

      const ownershipRefs = identity?.ownershipEntityRefs ?? [];
      return ownershipRefs.includes(project.ownedBy);
    },
    [loading, adminWrite.allowed, userPerm.allowed, identity],
  );

  return { loading, hasAnyWriteAccess, canWriteProject };
};
