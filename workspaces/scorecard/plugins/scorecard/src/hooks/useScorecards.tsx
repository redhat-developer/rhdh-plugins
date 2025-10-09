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
import { useEntity } from '@backstage/plugin-catalog-react';
import useAsync from 'react-use/lib/useAsync';
import { MetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { scorecardApiRef } from '../api';
import { useTranslation } from './useTranslation';

export interface UseScorecardsOptions {
  /**
   * Optional array of specific metric IDs to retrieve.
   * If not provided, all available metrics will be fetched.
   */
  metricIds?: string[];
}

export interface UseScorecardsResponse {
  /** Array of metric results from the scorecard API */
  scorecards: MetricResult[];
  /** Whether the data is currently being fetched */
  loadingData: boolean;
  /** Any error that occurred during the fetch */
  error: Error | undefined;
}

export const useScorecards = (options: UseScorecardsOptions = {}) => {
  const { entity } = useEntity();
  const scorecardApi = useApi(scorecardApiRef);
  const { metricIds } = options;
  const { t } = useTranslation();

  const { error, loading, value } = useAsync(async () => {
    if (
      !entity?.kind ||
      !entity?.metadata?.namespace ||
      !entity?.metadata?.name
    ) {
      throw new Error(t('errors.entityMissingProperties'));
    }

    try {
      const scorecards = await scorecardApi.getScorecards(entity, metricIds);

      if (!scorecards || !Array.isArray(scorecards)) {
        throw new Error(t('errors.invalidApiResponse'));
      }

      return scorecards;
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
  }, [entity, scorecardApi, t]);

  return useMemo(
    () => ({
      scorecards: value,
      loadingData: loading,
      error,
    }),
    [value, loading, error],
  );
};
