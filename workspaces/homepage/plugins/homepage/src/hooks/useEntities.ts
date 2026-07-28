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
import { catalogApiRef } from '@backstage/plugin-catalog-react';

import useAsync from 'react-use/lib/useAsync';

export const useEntities = ({ kind }: { kind: string | string[] }) => {
  const catalogApi = useApi(catalogApiRef);

  const { loading, error, value } = useAsync(async () => {
    return await catalogApi.queryEntities({
      filter: {
        kind: kind,
      },
      limit: 4,
    });
  }, []);

  return {
    data: value,
    error,
    isLoading: loading,
  };
};
