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
  EntityFilterQuery,
  EntityOrderQuery,
  QueryEntitiesRequest,
} from '@backstage/catalog-client/index';
import { GetPluginsRequest, SortOrder } from './types';

const DefaultOrderFields: EntityOrderQuery = [
  { field: 'metadata.name', order: 'asc' },
];
const defaultLimit = 20;
const requiredFilter = { kind: 'plugin' };

export const convertGetPluginsRequestToQueryEntitiesRequest = (
  query?: GetPluginsRequest,
): QueryEntitiesRequest => {
  let orderFields: EntityOrderQuery = DefaultOrderFields;

  if (query?.orderFields) {
    if (Array.isArray(query.orderFields)) {
      orderFields = query.orderFields.map(field => {
        if (typeof field === 'string') {
          const [key, order] = (field as string).split(',');
          return { field: key, order: order as SortOrder };
        }
        return field;
      });
    } else {
      if (typeof query.orderFields === 'string') {
        const [key, order] = (query.orderFields as string).split(',');
        orderFields = { field: key, order: order as SortOrder };
      }
    }
  }

  const filter: EntityFilterQuery = query?.filter
    ? {
        ...(typeof query.filter === 'string'
          ? JSON.parse(query.filter)
          : query.filter),
        ...requiredFilter,
      }
    : requiredFilter;
  const payload: QueryEntitiesRequest = {
    filter: filter,
    orderFields: orderFields,
    limit: query?.limit ? Number(query.limit) : defaultLimit,
    offset: query?.offset ? Number(query.offset) : undefined,
  };
  if (query?.searchTerm) {
    payload.fullTextFilter = { term: query.searchTerm };
  }
  return payload;
};

export const convertGetPluginRequestToSearchParams = (
  query?: GetPluginsRequest,
): URLSearchParams => {
  const params = new URLSearchParams();
  if (query?.limit) params.append('limit', String(query.limit));
  if (query?.offset) params.append('offset', String(query.offset));
  if (query?.searchTerm) params.append('searchTerm', query.searchTerm);
  if (query?.orderFields) {
    if (Array.isArray(query.orderFields)) {
      query.orderFields.forEach(({ field, order }) => {
        params.append('orderFields', `${field},${order}`);
      });
    } else {
      const { field, order } = query.orderFields;
      params.append('orderFields', `${field},${order}`);
    }
  }
  if (query?.filter) params.append('filter', JSON.stringify(query.filter));
  return params;
};

export const convertSearchParamsToGetPluginsRequest = (
  params?: URLSearchParams,
): GetPluginsRequest => {
  const request: GetPluginsRequest = {};

  // Convert 'limit' parameter
  const limit = params?.get('limit');
  if (limit) {
    request.limit = Number(limit);
  }

  // Convert 'offset' parameter
  const offset = params?.get('offset');
  if (offset) {
    request.offset = Number(offset);
  }

  // Convert 'searchTerm' parameter
  const searchTerm = params?.get('searchTerm');
  if (searchTerm) {
    request.searchTerm = searchTerm;
  }

  const orderFields = params?.getAll('orderFields');

  if (Array.isArray(orderFields) && orderFields?.length > 0) {
    request.orderFields = orderFields.map(field => {
      const [key, order] = field.split(',');
      return { field: key, order: order as SortOrder };
    });
  }

  const filter: Record<string, string> = {};
  params?.forEach((value, key) => {
    if (key.startsWith('filter[') && key.endsWith(']')) {
      const filterKey = key.slice(7, -1);
      filter[filterKey] = value;
    }
  });

  if (Object.keys(filter).length > 0) {
    request.filter = filter;
  }
  return request;
};
