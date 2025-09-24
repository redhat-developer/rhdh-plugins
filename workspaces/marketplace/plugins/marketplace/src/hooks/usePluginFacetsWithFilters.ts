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

import {
  GetEntityFacetsRequest,
  EntityFilterQuery,
} from '@backstage/catalog-client';

import { useMarketplaceApi } from './useMarketplaceApi';

/**
 * Converts search param filters to catalog filter format, optionally excluding certain filter prefixes
 */
const parseFiltersFromSearchParams = (
  searchParams: URLSearchParams,
  excludeFilterPrefixes: string[] = [],
): EntityFilterQuery => {
  const filters = searchParams.getAll('filter');
  const filterObj: EntityFilterQuery = {};

  filters.forEach(filter => {
    const firstEqualIndex = filter.indexOf('=');
    if (firstEqualIndex === -1) return;

    const key = filter.substring(0, firstEqualIndex);
    const value = filter.substring(firstEqualIndex + 1);

    // Skip filters that match any of the excluded prefixes
    if (excludeFilterPrefixes.some(prefix => key.startsWith(prefix))) {
      return;
    }

    if (filterObj[key]) {
      // If the key already exists, convert to array or append to existing array
      if (Array.isArray(filterObj[key])) {
        (filterObj[key] as string[]).push(value);
      } else {
        filterObj[key] = [filterObj[key] as string, value];
      }
    } else {
      filterObj[key] = value;
    }
  });

  return filterObj;
};

/**
 * Hook for getting plugin facets with current filters applied,
 * but excluding specific filter types to get accurate counts for those facet types
 */
export const usePluginFacetsWithFilters = (
  request: GetEntityFacetsRequest,
  excludeFilterPrefixes: string[] = [],
) => {
  const [searchParams] = useSearchParams();
  const marketplaceApi = useMarketplaceApi();

  // Build the request with current filters (excluding specified prefixes) for accurate facet counts
  const requestWithFilters = {
    ...request,
    filter: {
      ...request.filter,
      ...parseFiltersFromSearchParams(searchParams, excludeFilterPrefixes),
    },
  };
  return useQuery({
    queryKey: [
      'marketplaceApi',
      'getPluginFacetsWithFilters',
      requestWithFilters,
      excludeFilterPrefixes,
    ],
    queryFn: () =>
      marketplaceApi
        .getPluginFacets(requestWithFilters)
        .then(response => response.facets),
  });
};
