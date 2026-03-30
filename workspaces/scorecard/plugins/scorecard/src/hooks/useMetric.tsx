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
import { Metric } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { useTranslation } from './useTranslation';
import { scorecardApiRef } from '../api';

interface UseMetricOptions {
  metricId: string;
}

export const useMetric = (options: UseMetricOptions) => {
  const { metricId } = options;
  const { t } = useTranslation();
  const scorecardApi = useApi(scorecardApiRef);

  const { error, isLoading, data } = useQuery({
    queryKey: ['metric', metricId],
    queryFn: async () => {
      try {
        const { metrics } = await scorecardApi.getMetrics({
          metricIds: [metricId],
        });

        if (!Array.isArray(metrics) || metrics.length === 0) {
          throw new Error(t('errors.invalidApiResponse'));
        }

        return metrics[0] as Metric;
      } catch (err) {
        if (err instanceof Error) {
          throw err;
        }
        throw new Error(t('errors.fetchError' as any, { error: String(err) }));
      }
    },
    enabled: Boolean(metricId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    metric: data as Metric,
    loadingData: isLoading,
    error,
  };
};
