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
import { APIsViewOptions, TechdocsResponse } from '../types';
import { useDateRange } from '../components/Header/DateRangeContext';

export const useTechdocs = ({
  limit = 20,
}: APIsViewOptions): {
  techdocs: TechdocsResponse;
  error: Error | undefined;
  loading: boolean;
} => {
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [techdocs, setTechdocs] = useState<TechdocsResponse>({
    data: [],
  });

  const { startDateRange, endDateRange } = useDateRange();

  const api = useApi(adoptionInsightsApiRef);

  const getTechdocs = useCallback(async () => {
    return await api
      .getTechdocs({
        type: 'top_techdocs',
        start_date: startDateRange
          ? format(startDateRange, 'yyyy-MM-dd')
          : undefined,
        end_date: endDateRange ? format(endDateRange, 'yyyy-MM-dd') : undefined,
        limit,
      })
      .then(response => setTechdocs(response ?? { data: [] }));
  }, [api, limit, startDateRange, endDateRange]);

  const { error, loading } = useAsyncRetry(async () => {
    return await getTechdocs();
  }, [getTechdocs]);

  useEffect(() => {
    let mounted = true;
    if (!loading && mounted) {
      setLoadingData(false);
    }
    return () => {
      mounted = false;
    };
  }, [loading]);

  return { techdocs, error, loading: loadingData };
};
