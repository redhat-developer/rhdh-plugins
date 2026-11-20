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

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAsyncRetry } from 'react-use';
import { subDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

import { determineGrouping } from '../../utils/utils';
import { useAdoptionInsightsEventsReadPermission } from '../../hooks/useAdoptionInsightsEventsReadPermission';
import { PopularContentItem } from './types';

/** Default lookback window for homepage Popular Content cards (matches admin default). */
export const POPULAR_CONTENT_DEFAULT_LOOKBACK_DAYS = 28;

export type AdoptionInsightsRankingFetcher = (options: {
  limit: number;
  start_date: string;
  end_date: string;
  timezone: string;
  grouping: string;
}) => Promise<PopularContentItem[]>;

export type UseAdoptionInsightsRankingOptions = {
  /** Max rows to request from Adoption Insights (display count). */
  limit: number;
  /** When false, skip the network call (e.g. curated mode). */
  enabled: boolean;
  /** Dimension-specific mapper that calls the right Adoption Insights API. */
  fetchRanking: AdoptionInsightsRankingFetcher;
  /** Optional lookback; defaults to {@link POPULAR_CONTENT_DEFAULT_LOOKBACK_DAYS}. */
  lookbackDays?: number;
};

export type UseAdoptionInsightsRankingResult = {
  items: PopularContentItem[];
  loading: boolean;
  error: Error | undefined;
  /** True when the user lacks `adoption-insights.events.read`. */
  permissionDenied: boolean;
};

/**
 * Shared Adoption Insights fetch helper for homepage Popular Content widgets.
 * Requests only `limit` rows for the configured lookback window.
 */
export function useAdoptionInsightsRanking({
  limit,
  enabled,
  fetchRanking,
  lookbackDays = POPULAR_CONTENT_DEFAULT_LOOKBACK_DAYS,
}: UseAdoptionInsightsRankingOptions): UseAdoptionInsightsRankingResult {
  const { allowed, loading: permissionLoading } =
    useAdoptionInsightsEventsReadPermission();

  const [items, setItems] = useState<PopularContentItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const dateWindow = useMemo(() => {
    const end = new Date();
    const start = subDays(end, lookbackDays);
    return { start, end };
  }, [lookbackDays]);

  const grouping = determineGrouping(dateWindow.start, dateWindow.end);

  const shouldFetch = enabled && !permissionLoading && allowed;

  const load = useCallback(async () => {
    if (!shouldFetch) {
      setItems([]);
      return;
    }

    const timezone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    const ranked = await fetchRanking({
      limit,
      start_date: formatInTimeZone(dateWindow.start, timezone, 'yyyy-MM-dd'),
      end_date: formatInTimeZone(dateWindow.end, timezone, 'yyyy-MM-dd'),
      timezone,
      grouping,
    });
    setItems(ranked);
  }, [
    shouldFetch,
    fetchRanking,
    limit,
    dateWindow.start,
    dateWindow.end,
    grouping,
  ]);

  const { error, loading } = useAsyncRetry(async () => {
    if (!enabled) {
      setItems([]);
      return;
    }
    if (permissionLoading) {
      return;
    }
    if (!allowed) {
      setItems([]);
      return;
    }
    await load();
  }, [enabled, permissionLoading, allowed, load]);

  useEffect(() => {
    if (!enabled) {
      setLoadingData(false);
      return;
    }
    if (permissionLoading || loading) {
      setLoadingData(true);
      return;
    }
    setLoadingData(false);
  }, [enabled, permissionLoading, loading]);

  return {
    items,
    loading: enabled ? loadingData || permissionLoading : false,
    error: enabled && allowed ? error : undefined,
    permissionDenied: enabled && !permissionLoading && !allowed,
  };
}
