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
import React from 'react';

import { useApi } from '@backstage/core-plugin-api';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';
import type { Entity } from '@backstage/catalog-model';

import { entityApiRef, QueryEntitiesResponse } from '../api';

export const useEntities = () => {
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [data, setData] = React.useState<QueryEntitiesResponse<Entity>>();

  const entityServiceApi = useApi(entityApiRef);

  const getEntities = React.useCallback(async () => {
    return await entityServiceApi
      .getEntities({ limit: 4 })
      .then(response => setData(response));
  }, [entityServiceApi]);

  const { error, loading } = useAsyncRetry(async () => {
    return await getEntities();
  }, [getEntities]);

  React.useEffect(() => {
    let mounted = true;
    if (!loading && mounted) {
      setIsLoading(false);
    }
    return () => {
      mounted = false;
    };
  }, [loading]);

  return { data, error, isLoading };
};
