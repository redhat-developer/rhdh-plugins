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
import { useEffect, useMemo, useState } from 'react';

import {
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { Migration } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

export const useClientService = () => {
  const [baseUrl, setBaseUrl] = useState<string | undefined>(undefined);
  const fetchApi = useApi(fetchApiRef);
  const discoveryApi = useApi(discoveryApiRef);

  const { fetch } = fetchApi;
  useEffect(() => {
    discoveryApi.getBaseUrl('x2a').then(setBaseUrl);
  }, [discoveryApi]);

  const service = useMemo(
    () => ({
      isReady: baseUrl !== undefined,

      getAllMigrations: async (): Promise<Migration[]> => {
        const response = await fetch(`${baseUrl}/migrations`).then(r =>
          r.json(),
        );

        if (response.migrations) {
          return response.migrations;
        }
        throw new Error(
          `Failed to get migrations with code ${response?.response?.statusCode || response?.status}, message: ${response?.error?.message}`,
        );
      },

      deleteMigration: async (id: string): Promise<void> => {
        // TODO: implement backend API
        const response = await fetch(`${baseUrl}/migrations/${id}`, {
          method: 'DELETE',
        });

        if (response.status !== 200) {
          throw new Error(
            `Failed to delete migration with code ${response.status}, message: ${response.statusText}`,
          );
        }
      },
    }),
    [fetch, baseUrl],
  );

  return service;
};
