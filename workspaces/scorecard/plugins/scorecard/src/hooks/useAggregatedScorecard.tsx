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
import { UseResponseData } from './types';
import { AggregatedMetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import type { ScorecardApi } from '../api/types';

export const useAggregatedScorecard = (
  aggregationId: string,
): UseResponseData<AggregatedMetricResult> => {
  const { t } = useTranslation();

  const scorecardApi = useApi<ScorecardApi>(scorecardApiRef);

  const {
    error,
    loading: isLoading,
    value: data,
  } = useAsync(async () => {
    if (!aggregationId || aggregationId.trim() === '') {
      throw new Error(t('errors.missingAggregationId'));
    }

    try {
      return await scorecardApi.getAggregatedScorecard(aggregationId);
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
  }, [scorecardApi, aggregationId, t]);

  return useMemo(
    () => ({
      data,
      isLoading,
      error,
    }),
    [data, isLoading, error],
  );
};
