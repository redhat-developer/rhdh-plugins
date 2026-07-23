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
import { useState, useCallback, useEffect } from 'react';

import { useApi } from '@backstage/core-plugin-api';
import { useAsyncRetry } from 'react-use';
import { format } from 'date-fns';

import { adoptionInsightsApiRef } from '../api';
import { TimeSavedTotalsResponse } from '../types';
import { useDateRange } from '../components/Header/DateRangeContext';
import { formatInTimeZone } from 'date-fns-tz';

export const useTimeSavedTotals = (): {
  timeSavedTotals: TimeSavedTotalsResponse;
  error: Error | undefined;
  loading: boolean;
} => {
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [timeSavedTotals, setTimeSavedTotals] =
    useState<TimeSavedTotalsResponse>({
      data: { total_time_saved_minutes: 0, templates: [] },
    });

  const { startDateRange, endDateRange } = useDateRange();

  const api = useApi(adoptionInsightsApiRef);

  const fetchTimeSavedTotals = useCallback(async () => {
    const timezone = new Intl.DateTimeFormat().resolvedOptions().timeZone;

    return await api
      .getTimeSavedTotals({
        type: 'time_saved_totals',
        start_date: startDateRange
          ? formatInTimeZone(startDateRange, timezone, 'yyyy-MM-dd')
          : undefined,
        end_date: endDateRange ? format(endDateRange, 'yyyy-MM-dd') : undefined,
        timezone,
      })
      .then((response: TimeSavedTotalsResponse) =>
        setTimeSavedTotals(
          response ?? {
            data: { total_time_saved_minutes: 0, templates: [] },
          },
        ),
      );
  }, [api, startDateRange, endDateRange]);

  const { error, loading } = useAsyncRetry(async () => {
    return await fetchTimeSavedTotals();
  }, [fetchTimeSavedTotals]);

  useEffect(() => {
    let mounted = true;
    if (!loading && mounted) {
      setLoadingData(false);
    }
    return () => {
      mounted = false;
    };
  }, [loading]);

  return { timeSavedTotals, error, loading: loadingData };
};
