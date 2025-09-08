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

import { useSearchParams } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';

import { GetEntitiesRequest } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { useMarketplaceApi } from './useMarketplaceApi';

const filteredPluginsRequest: GetEntitiesRequest = {
  orderFields: [
    {
      field: 'metadata.title',
      order: 'asc',
    },
    {
      field: 'metadata.name',
      order: 'asc',
    },
  ],
};

export const useFilteredPlugins = () => {
  const [searchParams] = useSearchParams();
  const fullTextSearch = searchParams.get('q');
  const filters = searchParams.getAll('filter');

  const marketplaceApi = useMarketplaceApi();
  return useQuery({
    refetchOnWindowFocus: false,
    queryKey: ['marketplaceApi', 'getPlugins', filteredPluginsRequest],
    queryFn: () => marketplaceApi.getPlugins(filteredPluginsRequest),
    select: data => {
      let plugins = data.items;

      if (filters) {
        const categories = filters
          .filter(filter => filter.startsWith('spec.categories='))
          .map(filter => filter.substring('spec.categories='.length));
        if (categories.length > 0) {
          plugins = plugins.filter(plugin =>
            plugin.spec?.categories?.some(category =>
              categories.includes(category),
            ),
          );
        }

        const authors = filters
          .filter(filter => filter.startsWith('spec.authors.name='))
          .map(filter => filter.substring('spec.authors.name='.length));
        if (authors.length > 0) {
          plugins = plugins.filter(plugin =>
            plugin.spec?.authors?.some(author =>
              typeof author === 'string'
                ? authors.includes(author)
                : authors.includes(author.name),
            ),
          );
        }

        // Handle support type filters (both annotation and spec.support) with simple OR logic
        const supportTypeFilters = filters.filter(
          filter =>
            filter.startsWith(
              'metadata.annotations.extensions.backstage.io/',
            ) || filter.startsWith('spec.support.'),
        );

        if (supportTypeFilters.length > 0) {
          plugins = plugins.filter(plugin => {
            // Simple OR logic: plugin matches if it satisfies ANY individual filter
            return supportTypeFilters.some(filter => {
              // Handle annotation filters
              if (
                filter.startsWith(
                  'metadata.annotations.extensions.backstage.io/',
                )
              ) {
                const annotationFilter = filter.substring(
                  'metadata.annotations.'.length,
                );
                const [key, value] = annotationFilter.split('=');
                return plugin.metadata?.annotations?.[key] === value;
              }

              // Handle spec.support filters (including combined filters)
              if (filter.startsWith('spec.support.')) {
                // Handle combined filters like "spec.support.level=production,spec.support.name=Red Hat"
                if (filter.includes(',')) {
                  const conditions = filter.split(',');
                  return conditions.every(condition => {
                    const [fullKey, value] = condition.split('=');
                    const key = fullKey.replace('spec.support.', '');

                    if (key === 'level') {
                      return plugin.spec?.support?.level === value;
                    } else if (key === 'name') {
                      return plugin.spec?.support?.name === value;
                    }
                    return false;
                  });
                }

                // Handle single spec.support filters like "spec.support.level=tech-preview"
                const [fullKey, value] = filter.split('=');
                const key = fullKey.replace('spec.support.', '');

                if (key === 'level') {
                  return plugin.spec?.support?.level === value;
                } else if (key === 'name') {
                  return plugin.spec?.support?.name === value;
                }
              }

              return false;
            });
          });
        }
      }

      if (fullTextSearch) {
        const lowerCaseSearch = fullTextSearch.toLocaleLowerCase('en-US');
        plugins = plugins.filter(plugin => {
          const lowerCaseValue =
            plugin.metadata?.title?.toLocaleLowerCase('en-US');
          return lowerCaseValue?.includes(lowerCaseSearch);
        });
      }

      return {
        items: plugins,
        filteredItems: plugins.length,
        totalItems: data.totalItems,
      };
    },
  });
};
