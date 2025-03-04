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

import {
  EntityFilterQuery,
  EntityOrderQuery,
  GetEntityFacetsRequest,
  QueryEntitiesRequest,
} from '@backstage/catalog-client';

import { GetEntitiesRequest } from '../api';

export const decodeEntityFilterQuery = (
  searchParams: URLSearchParams,
): EntityFilterQuery | undefined => {
  if (!searchParams.has('filter')) {
    return undefined;
  }

  const filter: Record<string, string | string[]> = {};

  searchParams.getAll('filter').forEach(keyValuePair => {
    const firstEqualIndex = keyValuePair.indexOf('=');
    if (firstEqualIndex === -1) {
      return;
    }
    const name = keyValuePair.substring(0, firstEqualIndex);
    const value = keyValuePair.substring(firstEqualIndex + 1);

    const filterStringOrArray = filter[name];
    if (Array.isArray(filterStringOrArray)) {
      filterStringOrArray.push(value);
    } else if (filterStringOrArray) {
      filter[name] = [filterStringOrArray, value];
    } else {
      filter[name] = value;
    }
  });

  return filter;
};

export const decodeEntityOrderQuery = (
  searchParams: URLSearchParams,
): EntityOrderQuery | undefined => {
  if (!searchParams.has('orderFields')) {
    return undefined;
  }
  const orderFields = searchParams.getAll('orderFields');
  const decodedOrderFields: EntityOrderQuery = orderFields.map(field => {
    const [key, order] = field.split(',');
    return { field: key, order: order as 'asc' | 'desc' };
  });
  return decodedOrderFields;
};

/**
 * @public
 */
export const decodeGetEntitiesRequest = (
  searchParams: URLSearchParams,
): GetEntitiesRequest => {
  const request: QueryEntitiesRequest = {};

  if (searchParams.has('fields')) {
    request.fields = searchParams.getAll('fields');
  }
  if (searchParams.get('limit')) {
    request.limit = Number(searchParams.get('limit'));
  }
  if (searchParams.get('offset')) {
    request.offset = Number(searchParams.get('offset'));
  }
  request.filter = decodeEntityFilterQuery(searchParams);
  request.orderFields = decodeEntityOrderQuery(searchParams);
  if (searchParams.get('fullTextTerm')) {
    request.fullTextFilter = {
      term: searchParams.get('fullTextTerm')!,
      fields: searchParams.has('fullTextFields')
        ? searchParams.getAll('fullTextFields')
        : undefined,
    };
  }

  return request;
};

/**
 * @public
 */
export const decodeGetEntityFacetsRequest = (
  searchParams: URLSearchParams,
): GetEntityFacetsRequest => {
  return {
    facets: searchParams.getAll('facet'),
    filter: decodeEntityFilterQuery(searchParams),
  };
};
