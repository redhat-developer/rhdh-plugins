/*
 * Copyright The Backstage Authors
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
import { useSearchParams } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';

import {
  ExtensionsAnnotation,
  ExtensionsSupportLevel,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import { useExtensionsApi } from './useExtensionsApi';
import { CustomSelectItem } from '../shared-components/CustomSelectFilter';
import { colors } from '../consts';
import { useTranslation } from './useTranslation';

/**
 * Hook to get support type filter options based on currently filtered plugins
 * This ensures support type options only show what's available after applying other filters
 */
export const useFilteredSupportTypes = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const extensionsApi = useExtensionsApi();

  const filters = searchParams.getAll('filter');
  const fullTextSearch = searchParams.get('q');

  // Get all plugins (not pre-filtered)
  const allPluginsQuery = useQuery({
    queryKey: ['extensionsApi', 'getPlugins'],
    queryFn: () =>
      extensionsApi.getPlugins({
        orderFields: [{ field: 'metadata.title', order: 'asc' }],
      }),
    refetchOnWindowFocus: false,
  });

  // Get current filters excluding support type filters
  // This should exclude all support type filters so we can show all available support types
  const nonSupportFilters = filters.filter(
    filter =>
      !(
        filter === 'certified' ||
        filter === 'custom' ||
        filter.startsWith('support-level=')
      ),
  );

  // Calculate available support types from the filtered plugin data
  const items = useMemo(() => {
    if (!allPluginsQuery.data?.items) return [];

    let availablePlugins = allPluginsQuery.data.items;

    // Apply search filter first (always applied)
    if (fullTextSearch) {
      const lowerCaseSearch = fullTextSearch.toLocaleLowerCase('en-US');
      availablePlugins = availablePlugins.filter(plugin => {
        const lowerCaseValue =
          plugin.metadata?.title?.toLocaleLowerCase('en-US');
        return lowerCaseValue?.includes(lowerCaseSearch);
      });
    }

    // Apply category filter if present
    const categories = nonSupportFilters
      .filter(filter => filter.startsWith('category='))
      .map(filter => filter.substring('category='.length));
    if (categories.length > 0) {
      availablePlugins = availablePlugins.filter(plugin =>
        plugin.spec?.categories?.some(category =>
          categories.includes(category),
        ),
      );
    }

    // Apply author filter if present
    const authors = nonSupportFilters
      .filter(filter => filter.startsWith('author='))
      .map(filter => filter.substring('author='.length));
    if (authors.length > 0) {
      availablePlugins = availablePlugins.filter(plugin => {
        // Check spec.authors array
        if (
          plugin.spec?.authors?.some(author =>
            typeof author === 'string'
              ? authors.includes(author)
              : authors.includes(author.name),
          )
        ) {
          return true;
        }
        if (plugin.spec?.author && authors.includes(plugin.spec.author)) {
          return true;
        }
        return false;
      });
    }

    const allSupportTypeItems: CustomSelectItem[] = [];

    // Count certified plugins
    const certifiedPlugins = availablePlugins.filter(
      plugin =>
        plugin.metadata?.annotations?.[ExtensionsAnnotation.CERTIFIED_BY],
    );
    if (certifiedPlugins.length > 0) {
      const certifiedProviders = Array.from(
        new Set(
          certifiedPlugins
            .map(
              p => p.metadata?.annotations?.[ExtensionsAnnotation.CERTIFIED_BY],
            )
            .filter(Boolean),
        ),
      ).join(', ');

      allSupportTypeItems.push({
        label: t('badges.certified'),
        value: 'certified',
        count: certifiedPlugins.length,
        isBadge: true,
        badgeColor: colors.certified,
        helperText: t('badges.stableAndSecured' as any, {
          provider: certifiedProviders,
        }),
        displayOrder: 2,
      });
    }

    // Count custom plugins
    const customPlugins = availablePlugins.filter(
      plugin =>
        plugin.metadata?.annotations?.[ExtensionsAnnotation.PRE_INSTALLED] !==
        'true',
    );
    if (customPlugins.length > 0) {
      allSupportTypeItems.push({
        label: t('badges.customPlugin'),
        value: 'custom',
        count: customPlugins.length,
        isBadge: true,
        badgeColor: colors.custom,
        helperText: t('badges.addedByAdmin'),
        displayOrder: 3,
      });
    }

    // Count plugins by support level
    const supportLevelCounts: Record<string, number> = {};
    availablePlugins.forEach(plugin => {
      const supportLevel = plugin.spec?.support?.level;
      if (supportLevel) {
        supportLevelCounts[supportLevel] =
          (supportLevelCounts[supportLevel] || 0) + 1;
      }
    });

    Object.entries(supportLevelCounts).forEach(([level, count]) => {
      if (level === ExtensionsSupportLevel.GENERALLY_AVAILABLE) {
        allSupportTypeItems.push({
          label: t('badges.generallyAvailable'),
          value: `support-level=${level}`,
          count,
          isBadge: true,
          badgeColor: colors.generallyAvailable,
          helperText: t('badges.productionReady'),
          displayOrder: 1,
        });
      } else if (level === ExtensionsSupportLevel.TECH_PREVIEW) {
        allSupportTypeItems.push({
          label: t('badges.techPreview'),
          value: `support-level=${level}`,
          count,
          helperText: t('badges.pluginInDevelopment'),
          displayOrder: 4,
        });
      } else if (level === ExtensionsSupportLevel.DEV_PREVIEW) {
        allSupportTypeItems.push({
          label: t('badges.devPreview'),
          value: `support-level=${level}`,
          count,
          helperText: t('badges.earlyStageExperimental'),
          displayOrder: 5,
        });
      } else if (level === ExtensionsSupportLevel.COMMUNITY) {
        allSupportTypeItems.push({
          label: t('badges.communityPlugin'),
          value: `support-level=${level}`,
          count,
          helperText: t('badges.openSourceNoSupport'),
          displayOrder: 6,
        });
      }
    });

    const result = allSupportTypeItems.sort(
      (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0),
    );
    return result;
  }, [allPluginsQuery.data?.items, nonSupportFilters, fullTextSearch, t]);

  return {
    data: items,
    isLoading: allPluginsQuery.isLoading,
    error: allPluginsQuery.error,
  };
};
