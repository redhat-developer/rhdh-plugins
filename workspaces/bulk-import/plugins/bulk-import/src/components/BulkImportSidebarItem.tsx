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

import { SidebarItem } from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { usePermission } from '@backstage/plugin-permission-react';

import { bulkImportPermission } from '@red-hat-developer-hub/backstage-plugin-bulk-import-common';

import { getImageForIconClass } from '../utils/icons';

/**
 * @public
 * Bulk Import Icon
 */
export const BulkImportIcon = () => {
  return (
    <img
      src={getImageForIconClass('icon-bulk-import-white')}
      alt="bulk import icon"
      style={{ height: '25px' }}
    />
  );
};

export const BulkImportSidebarItem = () => {
  const { loading: isUserLoading, allowed } = usePermission({
    permission: bulkImportPermission,
    resourceRef: bulkImportPermission.resourceType,
  });

  const config = useApi(configApiRef);
  const isPermissionFrameworkEnabled =
    config.getOptionalBoolean('permission.enabled');

  if (!isUserLoading && isPermissionFrameworkEnabled) {
    return allowed ? (
      <SidebarItem
        text="Bulk import"
        to="bulk-import/repositories"
        icon={BulkImportIcon}
      />
    ) : null;
  }

  if (!isPermissionFrameworkEnabled) {
    return (
      <SidebarItem
        text="Bulk import"
        to="bulk-import/repositories"
        icon={BulkImportIcon}
      />
    );
  }
  return null;
};

export default BulkImportIcon;
