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
  Permission,
} from '@backstage/plugin-permission-common';
import {
  AsyncPermissionResult,
  permissionApiRef,
} from '@backstage/plugin-permission-react';

import useSWR from 'swr';

export type AsyncPermissionBatchResult = Omit<
  AsyncPermissionResult,
  'allowed'
> & {
  allowed: boolean[];
};

/**
 * Like usePermission() from '@backstage/plugin-permission-react' but for multiple permissions at once.
 *
 * @deprecated Only used for legacy dynamic permissions. Remove in next release.
 * @param permissions
 * @returns Object similar to AsyncPermissionResult but the "allowed" is a boolean array.
 */

export const usePermissionArray = (
  permissions: Permission[],
): AsyncPermissionBatchResult => {
  const permissionApi = useApi(permissionApiRef);

  const { data, error } = useSWR(permissions, async (args: Permission[]) => {
    const result = await Promise.all(
      args.map(permission => permissionApi.authorize({ permission })),
    );

    return result;
  });

  if (error) {
    return { error, loading: false, allowed: permissions.map(_ => false) };
  }
  if (data === undefined) {
    return { loading: true, allowed: permissions.map(_ => false) };
  }

  return {
    loading: false,
    allowed: data.map(d => d.result === AuthorizeResult.ALLOW),
  };
};
