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

import { useApi } from '@backstage/core-plugin-api';
import { useQuery } from '@tanstack/react-query';
import type { CollectorMetadata } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { scorecardApiRef } from '../api';
import { UseResponseData } from './types';

/**
 * Fetches collector metadata for a metric. Pass `enabled` so the request runs
 * only when the data-sources dialog is open and the metric has collector IDs.
 */
export const useMetricCollectors = (
  metricId: string,
  enabled: boolean,
): UseResponseData<CollectorMetadata[]> => {
  const scorecardApi = useApi(scorecardApiRef);

  const { error, isLoading, data } = useQuery({
    queryKey: ['metricCollectors', metricId],
    queryFn: () => scorecardApi.getMetricCollectors(metricId),
    enabled: enabled && Boolean(metricId?.trim()),
  });

  return {
    data,
    isLoading: enabled && isLoading,
    error: enabled ? error ?? undefined : undefined,
  };
};
