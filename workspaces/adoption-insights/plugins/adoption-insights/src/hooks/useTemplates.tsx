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
import { APIsViewOptions, TemplatesResponse } from '../types';
import { useDateRange } from '../components/Header/DateRangeContext';

export const useTemplates = ({
  limit = 20,
}: APIsViewOptions): {
  templates: TemplatesResponse;
  error: Error | undefined;
  loading: boolean;
} => {
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [templates, setTemplates] = useState<TemplatesResponse>({
    data: [],
  });

  const { startDateRange, endDateRange } = useDateRange();

  const api = useApi(adoptionInsightsApiRef);

  const getTemplates = useCallback(async () => {
    return await api
      .getTemplates({
        type: 'top_templates',
        start_date: startDateRange
          ? format(startDateRange, 'yyyy-MM-dd')
          : undefined,
        end_date: endDateRange ? format(endDateRange, 'yyyy-MM-dd') : undefined,
        limit,
      })
      .then((response: TemplatesResponse) =>
        setTemplates(response ?? { data: [] }),
      );
  }, [api, limit, startDateRange, endDateRange]);

  const { error, loading } = useAsyncRetry(async () => {
    return await getTemplates();
  }, [getTemplates]);

  useEffect(() => {
    let mounted = true;
    if (!loading && mounted) {
      setLoadingData(false);
    }
    return () => {
      mounted = false;
    };
  }, [loading]);

  return { templates, error, loading: loadingData };
};
