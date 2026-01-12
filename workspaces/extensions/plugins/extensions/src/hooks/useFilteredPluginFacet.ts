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

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import { ExtensionsAnnotation } from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import { useExtensionsApi } from './useExtensionsApi';

/**
 * Hook to get plugin facets filtered by current active filters
 * @param facet - The facet field to get values for
 * @param excludeFilterType - The filter type to exclude from the filter (allows getting options for the current filter)
 */
export const useFilteredPluginFacet = (
  facet: string,
  excludeFilterType?: string,
) => {
  const [searchParams] = useSearchParams();
  const extensionsApi = useExtensionsApi();

  const filters = searchParams.getAll('filter');
  const fullTextSearch = searchParams.get('q');

  // Get all plugins and apply client-side filtering for accurate facet calculation
  const pluginsQuery = useQuery({
    queryKey: ['extensionsApi', 'getPlugins'],
    queryFn: () =>
      extensionsApi.getPlugins({
        orderFields: [{ field: 'metadata.title', order: 'asc' }],
      }),
  });

  return useQuery({
    queryKey: [
      'extensionsApi',
      'getFilteredPluginFacet',
      facet,
      filters,
      fullTextSearch,
      excludeFilterType,
    ],
    queryFn: async () => {
      if (!pluginsQuery.data?.items) return undefined;

      // Apply filtering excluding the specified filter type
      const activeFilters = filters.filter(filter => {
        if (!excludeFilterType) return true;

        // Exclude filters of the specified type
        if (
          excludeFilterType === 'category' &&
          filter.startsWith('category=')
        ) {
          return false;
        }
        if (excludeFilterType === 'author' && filter.startsWith('author=')) {
          return false;
        }
        if (
          excludeFilterType === 'support' &&
          (filter === 'certified' ||
            filter === 'custom' ||
            filter.startsWith('support-level='))
        ) {
          return false;
        }
        return true;
      });

      let filteredPlugins = pluginsQuery.data.items;

      // Apply search filter first (always applied, not excluded)
      if (fullTextSearch) {
        const lowerCaseSearch = fullTextSearch.toLocaleLowerCase('en-US');
        filteredPlugins = filteredPlugins.filter(plugin => {
          const lowerCaseValue =
            plugin.metadata?.title?.toLocaleLowerCase('en-US');
          return lowerCaseValue?.includes(lowerCaseSearch);
        });
      }

      // Apply category filters
      const categories = activeFilters
        .filter(filter => filter.startsWith('category='))
        .map(filter => filter.substring('category='.length));
      if (categories.length > 0) {
        filteredPlugins = filteredPlugins.filter(plugin =>
          plugin.spec?.categories?.some(category =>
            categories.includes(category),
          ),
        );
      }

      // Apply author filters
      const authors = activeFilters
        .filter(filter => filter.startsWith('author='))
        .map(filter => filter.substring('author='.length));
      if (authors.length > 0) {
        filteredPlugins = filteredPlugins.filter(plugin => {
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
          // Check certification annotation as fallback
          const certifiedBy =
            plugin.metadata?.annotations?.[ExtensionsAnnotation.CERTIFIED_BY];
          return certifiedBy && authors.includes(certifiedBy);
        });
      }

      // Apply support type filters
      const showCertified = activeFilters.includes('certified');
      const showCustom = activeFilters.includes('custom');
      const supportLevels = activeFilters
        .filter(filter => filter.startsWith('support-level='))
        .map(filter => filter.substring('support-level='.length));

      if (showCertified || showCustom || supportLevels.length > 0) {
        filteredPlugins = filteredPlugins.filter(plugin => {
          if (
            showCertified &&
            plugin.metadata?.annotations?.[ExtensionsAnnotation.CERTIFIED_BY]
          ) {
            return true;
          }
          if (
            showCustom &&
            plugin.metadata?.annotations?.[
              ExtensionsAnnotation.PRE_INSTALLED
            ] !== 'true'
          ) {
            return true;
          }
          if (supportLevels.length > 0 && plugin.spec?.support?.level) {
            return supportLevels.includes(plugin.spec.support.level);
          }
          return false;
        });
      }

      // Calculate facet values from filtered plugins
      const facetValues: Record<string, number> = {};

      filteredPlugins.forEach(plugin => {
        let values: any[] = [];

        // Extract values based on facet path
        if (facet === 'spec.categories') {
          values = plugin.spec?.categories || [];
        } else if (facet === 'spec.authors.name') {
          if (plugin.spec?.authors && plugin.spec.authors.length > 0) {
            values = plugin.spec.authors
              .map(author =>
                typeof author === 'string' ? author : author.name,
              )
              .filter(Boolean);
          } else if (plugin.spec?.author) {
            values = [plugin.spec.author];
          }
        }

        values.forEach(value => {
          facetValues[value] = (facetValues[value] || 0) + 1;
        });
      });

      // Convert to expected format
      const result = Object.entries(facetValues).map(([value, count]) => ({
        value,
        count,
      }));
      return result;
    },
    enabled: !!pluginsQuery.data,
  });
};
