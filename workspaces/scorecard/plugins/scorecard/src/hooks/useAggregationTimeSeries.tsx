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

import { useQuery } from '@tanstack/react-query';
import { useApi } from '@backstage/core-plugin-api';
import type { AggregatedMetricTimeSeriesResponse } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { scorecardApiRef } from '../api';
import { TIME_SERIES_DEFAULT_RANGE_DAYS } from '../utils/constants';
import { getDefaultTimeSeriesRange } from '../utils/timeSeriesRange';
import { useTranslation } from './useTranslation';
import { UseResponseData } from './types';

interface UseAggregationTimeSeriesOptions {
  aggregationId: string;
  enabled?: boolean;
}

export const useAggregationTimeSeries = ({
  aggregationId,
  enabled = true,
}: UseAggregationTimeSeriesOptions): UseResponseData<AggregatedMetricTimeSeriesResponse> => {
  const { t } = useTranslation();
  const scorecardApi = useApi(scorecardApiRef);

  const { error, isLoading, data } = useQuery({
    queryKey: [
      'aggregationTimeSeries',
      aggregationId,
      TIME_SERIES_DEFAULT_RANGE_DAYS,
    ],
    queryFn: async () => {
      try {
        const { from, to } = getDefaultTimeSeriesRange();
        return await scorecardApi.getAggregationTimeSeries({
          aggregationId,
          from,
          to,
        });
      } catch (err) {
        if (err instanceof Error) {
          throw err;
        }
        throw new Error(
          t('errors.fetchError' as any, {
            error: String(err),
          }),
        );
      }
    },
    enabled: Boolean(aggregationId?.trim()) && enabled,
  });

  return {
    data,
    isLoading,
    error: error ?? undefined,
  };
};
