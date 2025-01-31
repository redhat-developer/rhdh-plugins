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

import {
  EntityOrderQuery,
  QueryEntitiesRequest,
} from '@backstage/catalog-client/index';
import { GetPluginsRequest, SortOrder } from '../types';

const requiredFilter = { kind: 'plugin' };

/**
 *
 * @public
 */
export const decodeFilterParams = (searchParams: URLSearchParams) => {
  const filter: Record<string, string[]> = {};

  searchParams.getAll('filter').forEach(param => {
    const [key, value] = param.split('=').map(decodeURIComponent);
    if (!filter[key]) {
      filter[key] = [];
    }
    filter[key].push(value);
  });

  return filter;
};

/**
 *
 * @public
 */
export const decodeOrderFields = (searchParams: URLSearchParams) => {
  const orderFields = searchParams.getAll('orderFields');
  const decodedOrderFields: EntityOrderQuery = orderFields.map(field => {
    const [key, order] = field.split(',');
    return { field: key, order: order as SortOrder };
  });
  return decodedOrderFields;
};

/**
 *
 * @public
 */
export const decodeGetPluginsRequest = (
  queryString: string,
): GetPluginsRequest => {
  const searchParams = new URLSearchParams(queryString);
  return {
    orderFields:
      searchParams.getAll('orderFields').length > 0
        ? decodeOrderFields(searchParams)
        : undefined,
    searchTerm: searchParams.get('searchTerm') || undefined,
    limit: searchParams.get('limit')
      ? Number(searchParams.get('limit'))
      : undefined,
    offset: searchParams.get('offset')
      ? Number(searchParams.get('offset'))
      : undefined,
    filter:
      searchParams.getAll('filter').length > 0
        ? decodeFilterParams(searchParams)
        : undefined,
  };
};

/**
 * @public
 */
export const convertGetPluginsRequestToQueryEntitiesRequest = (
  query?: GetPluginsRequest,
): QueryEntitiesRequest => {
  const entitiesRequest: QueryEntitiesRequest = {};

  entitiesRequest.filter = { ...query?.filter, ...requiredFilter };

  if (query?.orderFields) {
    entitiesRequest.orderFields = query.orderFields;
  }
  if (query?.limit) {
    entitiesRequest.limit = query.limit;
  }
  if (query?.offset) {
    entitiesRequest.offset = query.offset;
  }
  if (query?.searchTerm) {
    entitiesRequest.fullTextFilter = {
      term: query.searchTerm,
    };
  }
  return entitiesRequest;
};

/**
 * @public
 */
export const decodeFacetParams = (searchParams: URLSearchParams) => {
  return searchParams.getAll('facet').map(decodeURIComponent);
};

/**
 * @public
 */
export const decodeQueryParams = (queryString: string) => {
  const searchParams = new URLSearchParams(queryString);

  return {
    ...(searchParams.getAll('filter').length > 0
      ? { filter: decodeFilterParams(searchParams) }
      : {}),
    ...(searchParams.getAll('facet').length > 0
      ? { facets: decodeFacetParams(searchParams) }
      : {}),
  };
};
