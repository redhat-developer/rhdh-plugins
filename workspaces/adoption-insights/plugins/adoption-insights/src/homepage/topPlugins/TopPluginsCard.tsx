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

import { useCallback, useMemo } from 'react';

import { useApi } from '@backstage/core-plugin-api';

import { adoptionInsightsApiRef } from '../../api';
import { useTranslation } from '../../hooks/useTranslation';
import {
  PopularContentListCard,
  resolvePopularContentConfig,
  resolvePopularContentItems,
  shouldFetchAdoptionInsights,
  useAdoptionInsightsRanking,
} from '../popularContent';
import { mapPluginTrendsToPopularContentItems } from './mapPlugins';

export type TopPluginsCardProps = {
  mode?: string;
  title?: string;
  displayCount?: number | string;
  limit?: number | string;
  items?: unknown;
  [key: string]: unknown;
};

/**
 * Homepage card listing org-wide top plugins / extensions from Adoption Insights.
 */
export function TopPluginsCard(props: TopPluginsCardProps) {
  const { t } = useTranslation();
  const api = useApi(adoptionInsightsApiRef);

  const defaultTitle = t('homepage.topPlugins.title');

  const config = useMemo(
    () =>
      resolvePopularContentConfig(props, {
        title: defaultTitle,
      }),
    [props, defaultTitle],
  );

  const fetchRanking = useCallback(
    async (options: {
      limit: number;
      start_date: string;
      end_date: string;
      timezone: string;
      grouping: string;
    }) => {
      const response = await api.getPlugins({
        type: 'top_plugins',
        start_date: options.start_date,
        end_date: options.end_date,
        timezone: options.timezone,
        limit: options.limit,
        grouping: options.grouping,
      });
      return mapPluginTrendsToPopularContentItems(response?.data ?? []);
    },
    [api],
  );

  const ranking = useAdoptionInsightsRanking({
    limit: config.displayCount,
    enabled: shouldFetchAdoptionInsights(config.mode),
    fetchRanking,
  });

  const items = useMemo(
    () =>
      resolvePopularContentItems({
        config,
        ranked: ranking.items,
      }),
    [config, ranking.items],
  );

  return (
    <PopularContentListCard
      title={config.title ?? defaultTitle}
      titleTooltip={t('homepage.topPlugins.trendTooltip')}
      items={items}
      loading={ranking.loading}
      error={ranking.error}
      permissionDenied={ranking.permissionDenied}
      emptyMessage={t('homepage.topPlugins.empty')}
      errorMessage={t('homepage.topPlugins.error')}
      permissionDeniedMessage={t('homepage.topPlugins.permissionDenied')}
      visitsLabel={t('homepage.topPlugins.visits')}
      showRank
    />
  );
}
