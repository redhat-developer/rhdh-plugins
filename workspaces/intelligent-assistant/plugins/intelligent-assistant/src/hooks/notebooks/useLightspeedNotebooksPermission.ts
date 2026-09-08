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
  iaNotebooksManagePermission,
  iaNotebooksUsePermission,
} from '@red-hat-developer-hub/backstage-plugin-intelligent-assistant-common';

export const useLightspeedNotebooksPermission = () => {
  const canUse = usePermission({
    permission: iaNotebooksUsePermission,
  });

  const canManage = usePermission({
    permission: iaNotebooksManagePermission,
  });

  return {
    loading: canUse.loading || canManage.loading,
    allowed: canUse.allowed,
    canManage: canManage.allowed,
    iaNotebooksUsePermissionName: iaNotebooksUsePermission.name,
    iaNotebooksManagePermissionName: iaNotebooksManagePermission.name,
  };
};
