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

import {
  configApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { useAsync } from 'react-use';

export const useQuickstartButtonPermission = () => {
  const identityApi = useApi(identityApiRef);
  const configApi = useApi(configApiRef);

  const getUserAuthorization = async () => {
    const { token: idToken } = await identityApi.getCredentials();
    const backendUrl = configApi.getString('backend.baseUrl');
    const jsonResponse = await fetch(`${backendUrl}/api/permission/`, {
      headers: {
        ...(idToken && { Authorization: `Bearer ${idToken}` }),
      },
    });
    return jsonResponse.json();
  };
  const { loading: isUserLoading, value: result } = useAsync(
    async () => await getUserAuthorization(),
    [],
  );

  const isRBACPluginEnabled =
    configApi.getOptionalBoolean('permission.enabled');

  if (!isRBACPluginEnabled) return true;

  return !isUserLoading && result.status === 'Authorized';
};
