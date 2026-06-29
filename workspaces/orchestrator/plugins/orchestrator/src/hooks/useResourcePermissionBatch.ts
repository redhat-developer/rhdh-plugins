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

import { useApi } from '@backstage/core-plugin-api';
import {
  AuthorizeResult,
  ResourcePermission,
} from '@backstage/plugin-permission-common';
import {
  AsyncPermissionResult,
  permissionApiRef,
} from '@backstage/plugin-permission-react';

import useSWR from 'swr';

export type AsyncResourcePermissionBatchResult = Omit<
  AsyncPermissionResult,
  'allowed'
> & {
  allowed: boolean[];
};

/**
 * Batch variant of usePermission for resource permissions with per-resource refs.
 */
export const useResourcePermissionBatch = (
  permission: ResourcePermission,
  resourceRefs: string[],
): AsyncResourcePermissionBatchResult => {
  const permissionApi = useApi(permissionApiRef);

  const { data, error } = useSWR(
    [permission.name, ...resourceRefs],
    async () => {
      if (resourceRefs.length === 0) {
        return [];
      }

      return Promise.all(
        resourceRefs.map(resourceRef =>
          permissionApi.authorize({ permission, resourceRef }),
        ),
      );
    },
  );

  if (error) {
    return { error, loading: false, allowed: resourceRefs.map(() => false) };
  }
  if (data === undefined) {
    return { loading: true, allowed: resourceRefs.map(() => false) };
  }

  return {
    loading: false,
    allowed: data.map(d => d.result === AuthorizeResult.ALLOW),
  };
};
