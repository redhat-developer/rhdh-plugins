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
import { useAsyncRetry, useInterval } from 'react-use';

import { adoptionInsightsApiRef } from '../api';
import { CatalogEntities, CatalogEntitiesOptions } from '../types';

export const useCatalogEntities = ({
  start_date,
  end_date,
  limit = 3,
  intervalMs = 10000,
}: CatalogEntitiesOptions): {
  catalogEntities: CatalogEntities[];
  error: Error | undefined;
  loading: boolean;
} => {
  const [loadingData, setLoadingData] = React.useState<boolean>(true);
  const [catalogEntities, setCatalogEntities] = React.useState<
    CatalogEntities[]
  >([]);

  const api = useApi(adoptionInsightsApiRef);

  const getCatalogEntities = React.useCallback(async () => {
    return await api
      .getCatalogEntities({
        type: 'top_catalog_entities',
        start_date,
        end_date,
        limit,
      })
      .then(response => setCatalogEntities(response ?? []));
  }, [api, start_date, end_date, limit]);

  const { error, loading, retry } = useAsyncRetry(async () => {
    return await getCatalogEntities();
  }, [getCatalogEntities]);

  useInterval(() => retry(), intervalMs);

  React.useEffect(() => {
    let mounted = true;
    if (!loading && mounted) {
      setLoadingData(false);
    }
    return () => {
      mounted = false;
    };
  }, [loading]);

  return { catalogEntities, error, loading: loadingData };
};
