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
} from '@backstage/catalog-client';

import { GetEntitiesRequest } from '../api';

export const encodeEntityFilterQuery = (filter: EntityFilterQuery) => {
  const params = new URLSearchParams();

  Object.entries(filter).forEach(([key, value]) => {
    const values = Array.isArray(value) ? value : [value];
    values.forEach(v => {
      params.append('filter', `${key}=${v}`);
    });
  });

  return params;
};

export const encodeEntityOrderQuery = (orderFields: EntityOrderQuery) => {
  const params = new URLSearchParams();
  if (Array.isArray(orderFields)) {
    orderFields.forEach(({ field, order }) => {
      params.append('orderFields', `${field},${order}`);
    });
  } else {
    const { field, order } = orderFields;
    params.append('orderFields', `${field},${order}`);
  }
  return params;
};

/**
 * @public
 */
export const encodeGetEntitiesRequest = (
  request: GetEntitiesRequest,
): URLSearchParams => {
  const params = new URLSearchParams();
  if (!request) {
    return params;
  }
  if (request.fields) {
    request.fields.forEach(field => params.append('field', field));
  }
  if (request.limit) {
    params.append('limit', String(request.limit));
  }
  if (request.offset) {
    params.append('offset', String(request.offset));
  }
  if (request.filter) {
    encodeEntityFilterQuery(request.filter).forEach((value, key) =>
      params.append(key, value),
    );
  }
  if (request.orderFields) {
    encodeEntityOrderQuery(request.orderFields).forEach((value, key) =>
      params.append(key, value),
    );
  }
  if (request.fullTextFilter?.term) {
    params.append('fullTextTerm', request.fullTextFilter.term);
    request.fullTextFilter.fields?.forEach(field =>
      params.append('fullTextFields', field),
    );
  }
  return params;
};

/**
 * @public
 */
export const encodeGetEntityFacetsRequest = (
  request: GetEntityFacetsRequest,
) => {
  const params = new URLSearchParams();
  if (!request) {
    return params;
  }
  if (request.facets) {
    request.facets.forEach(facet => params.append('facet', facet));
  }
  if (request.filter) {
    encodeEntityFilterQuery(request.filter).forEach((value, key) =>
      params.append(key, value),
    );
  }
  return params;
};
