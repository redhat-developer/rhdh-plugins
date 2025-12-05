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
import { useMemo } from 'react';

import { useApi } from '@backstage/core-plugin-api';
import useAsync from 'react-use/lib/useAsync';

import { scorecardApiRef } from '../api';
import { AggregatedMetricResult } from '../utils/utils';

export const useAggregatedScorecards = () => {
  const scorecardApi = useApi(scorecardApiRef);

  const { error, loading, value } = useAsync(async () => {
    try {
      const aggregatedScorecards = await scorecardApi.getAggregatedScorecards();

      if (!aggregatedScorecards || !Array.isArray(aggregatedScorecards)) {
        throw new Error(
          'Invalid response format from aggregated scorecard API',
        );
      }

      return aggregatedScorecards;
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error(
        `Unexpected error fetching aggregated scorecards: ${String(err)}`,
      );
    }
  }, [scorecardApi]);

  return useMemo(
    () => ({
      aggregatedScorecards: value as AggregatedMetricResult[],
      loadingData: loading,
      error,
    }),
    [value, loading, error],
  );
};
