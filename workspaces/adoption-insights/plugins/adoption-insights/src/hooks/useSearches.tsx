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
import { useEffect, useCallback, useState } from 'react';

import { useApi } from '@backstage/core-plugin-api';
import { useAsyncRetry } from 'react-use';
import { format } from 'date-fns';

import { SearchesResponse } from '../types';
import { adoptionInsightsApiRef } from '../api';
import { useDateRange } from '../components/Header/DateRangeContext';
import { determineGrouping } from '../utils/utils';
import { formatInTimeZone } from 'date-fns-tz';

export const useSearches = (): {
  searches: SearchesResponse;
  error: Error | undefined;
  loading: boolean;
} => {
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [searches, setSearches] = useState<SearchesResponse>({
    data: [],
  });

  const { startDateRange, endDateRange } = useDateRange();
  const grouping = determineGrouping(startDateRange, endDateRange);

  const api = useApi(adoptionInsightsApiRef);

  const getSearches = useCallback(async () => {
    const timezone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    return await api
      .getSearches({
        type: 'top_searches',
        start_date: startDateRange
          ? formatInTimeZone(startDateRange, timezone, 'yyyy-MM-dd')
          : undefined,
        end_date: endDateRange ? format(endDateRange, 'yyyy-MM-dd') : undefined,
        timezone,
        grouping,
        limit: 24,
      })
      .then(response =>
        setSearches(response ?? { grouping: undefined, data: [] }),
      );
  }, [api, startDateRange, endDateRange, grouping]);

  const { error, loading } = useAsyncRetry(async () => {
    return await getSearches();
  }, [getSearches]);

  useEffect(() => {
    let mounted = true;
    if (!loading && mounted) {
      setLoadingData(false);
    }
    return () => {
      mounted = false;
    };
  }, [loading]);

  return { searches, error, loading: loadingData };
};
