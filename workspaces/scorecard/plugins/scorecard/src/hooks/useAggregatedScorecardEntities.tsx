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
import type { EntityMetricDetailResponse } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { scorecardApiRef } from '../api';
import { useTranslation } from './useTranslation';

interface UseAggregatedScorecardEntitiesOptions {
  metricId: string;
  page?: number;
  pageSize?: number;
  ownershipEntityRefs?: string[];
  orderBy?: string | null;
  order?: 'asc' | 'desc';
  enabled?: boolean;
}

export const useAggregatedScorecardEntities = (
  options: UseAggregatedScorecardEntitiesOptions,
) => {
  const scorecardApi = useApi(scorecardApiRef);
  const {
    metricId,
    page = 1,
    pageSize = 5,
    ownershipEntityRefs = [],
    orderBy = null,
    order = 'asc',
    enabled = true,
  } = options;
  const { t } = useTranslation();

  const { error, isLoading, data } = useQuery({
    queryKey: [
      'aggregatedScorecardEntities',
      metricId,
      page,
      pageSize,
      ownershipEntityRefs,
      orderBy,
      order,
    ],
    queryFn: async () => {
      try {
        const aggregatedScorecardEntities =
          await scorecardApi.getAggregatedScorecardEntities({
            metricId,
            page,
            pageSize,
            ownershipEntityRefs,
            orderBy,
            order,
          });

        if (
          !aggregatedScorecardEntities ||
          Array.isArray(aggregatedScorecardEntities) ||
          typeof aggregatedScorecardEntities !== 'object'
        ) {
          throw new Error(t('errors.invalidApiResponse'));
        }

        return aggregatedScorecardEntities;
      } catch (err) {
        if (err instanceof Error) {
          throw err;
        }
        throw new Error(t('errors.fetchError' as any, { error: String(err) }));
      }
    },
    enabled: Boolean(metricId) && enabled,
  });

  return {
    aggregatedScorecardEntities: data as EntityMetricDetailResponse,
    loadingData: isLoading,
    error,
  };
};
