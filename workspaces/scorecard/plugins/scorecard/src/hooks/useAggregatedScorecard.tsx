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
import { useTranslation } from './useTranslation';
import { AggregatedMetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

interface UseAggregatedScorecardOptions {
  metricId: string;
}

export const useAggregatedScorecard = (
  options: UseAggregatedScorecardOptions,
) => {
  const scorecardApi = useApi(scorecardApiRef);

  const { metricId } = options;
  const { t } = useTranslation();

  const { error, loading, value } = useAsync(async () => {
    try {
      const aggregatedScorecard = await scorecardApi.getAggregatedScorecard(
        metricId,
      );

      if (!aggregatedScorecard || !Array.isArray(aggregatedScorecard)) {
        throw new Error(t('errors.invalidApiResponse'));
      }

      return aggregatedScorecard;
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
  }, [scorecardApi]);

  return useMemo(
    () => ({
      aggregatedScorecard: value as AggregatedMetricResult[],
      loadingData: loading,
      error,
    }),
    [value, loading, error],
  );
};
