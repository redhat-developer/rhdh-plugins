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
import { useAsyncRetry } from 'react-use';
import { format } from 'date-fns';

import { adoptionInsightsApiRef } from '../api';
import { APIsViewOptions, CatalogEntitiesResponse } from '../types';
import { useDateRange } from '../components/Header/DateRangeContext';

export const useCatalogEntities = ({
  limit = 20,
  kind = '',
}: APIsViewOptions): {
  catalogEntities: CatalogEntitiesResponse;
  error: Error | undefined;
  loading: boolean;
} => {
  const [loadingData, setLoadingData] = React.useState<boolean>(true);
  const [catalogEntities, setCatalogEntities] =
    React.useState<CatalogEntitiesResponse>({ data: [] });

  const { startDateRange, endDateRange } = useDateRange();

  const api = useApi(adoptionInsightsApiRef);

  const getCatalogEntities = React.useCallback(async () => {
    return await api
      .getCatalogEntities({
        type: 'top_catalog_entities',
        start_date: startDateRange
          ? format(startDateRange, 'yyyy-MM-dd')
          : undefined,
        end_date: endDateRange ? format(endDateRange, 'yyyy-MM-dd') : undefined,
        limit,
        kind,
      })
      .then((response: CatalogEntitiesResponse) =>
        setCatalogEntities(response ?? { data: [] }),
      );
  }, [api, kind, limit, startDateRange, endDateRange]);

  const { error, loading } = useAsyncRetry(async () => {
    return await getCatalogEntities();
  }, [getCatalogEntities]);

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
