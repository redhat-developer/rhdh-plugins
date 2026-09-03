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

import { stringifyEntityRef } from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useQuery } from '@tanstack/react-query';
import type { MetricTimeSeriesResponse } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { scorecardApiRef } from '../api';
import { TIME_SERIES_DEFAULT_RANGE_DAYS } from '../utils/constants';
import { getDefaultTimeSeriesRange } from '../utils/timeSeriesRange';
import { useTranslation } from './useTranslation';
import { UseResponseData } from './types';

/**
 * Fetches the 30-day catalog time series for one metric on the current entity.
 */
export const useMetricTimeSeries = (
  metricId: string,
): UseResponseData<MetricTimeSeriesResponse> => {
  const { entity } = useEntity();
  const scorecardApi = useApi(scorecardApiRef);
  const { t } = useTranslation();

  const hasEntity = Boolean(
    entity?.kind && entity?.metadata?.namespace && entity?.metadata?.name,
  );
  const entityRef = hasEntity ? stringifyEntityRef(entity) : '';

  const { error, isLoading, data } = useQuery({
    queryKey: [
      'metricTimeSeries',
      entityRef,
      metricId,
      TIME_SERIES_DEFAULT_RANGE_DAYS,
    ],
    queryFn: async () => {
      if (
        !entity?.kind ||
        !entity?.metadata?.namespace ||
        !entity?.metadata?.name
      ) {
        throw new Error(t('errors.entityMissingProperties'));
      }

      try {
        const { from, to } = getDefaultTimeSeriesRange();
        return await scorecardApi.getMetricTimeSeries({
          entity,
          metricId,
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
    enabled: Boolean(metricId?.trim()) && hasEntity,
  });

  return {
    data,
    isLoading,
    error: error ?? undefined,
  };
};
