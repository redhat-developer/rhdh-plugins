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

import {
  encodeEntityFilterQuery,
  encodeEntityOrderQuery,
  encodeGetEntitiesRequest,
  encodeGetEntityFacetsRequest,
} from './encodeQueryParams';

describe('encodeEntityFilterQuery', () => {
  it('should handle empty filter object', () => {
    const filter: EntityFilterQuery = {};
    const params = encodeEntityFilterQuery(filter).toString();
    expect(params).toBe('');
  });

  it('should encode single filter', () => {
    const filter: EntityFilterQuery = { 'spec.category': 'CI/CD' };
    const params = encodeEntityFilterQuery(filter).toString();
    expect(params).toBe('filter=spec.category%3DCI%2FCD');
  });

  it('should encode multiple filters', () => {
    const filter: EntityFilterQuery = {
      'spec.category': ['CI', 'CD'],
      'spec.owner': 'admin',
    };
    const params = encodeEntityFilterQuery(filter).toString();
    expect(params).toBe(
      'filter=spec.category%3DCI&filter=spec.category%3DCD&filter=spec.owner%3Dadmin',
    );
  });
});

describe('encodeEntityOrderQuery', () => {
  it('should encode single orderFields', () => {
    const orderFields: EntityOrderQuery = {
      field: 'metadata.title',
      order: 'asc',
    };
    const params = encodeEntityOrderQuery(orderFields).toString();
    expect(params).toBe('orderFields=metadata.title%2Casc');
  });

  it('should encode multiple orderFields', () => {
    const orderFields: EntityOrderQuery = [
      { field: 'metadata.title', order: 'desc' },
      { field: 'metadata.name', order: 'asc' },
    ];
    const params = encodeEntityOrderQuery(orderFields).toString();
    expect(params).toBe(
      'orderFields=metadata.title%2Cdesc&orderFields=metadata.name%2Casc',
    );
  });
});

describe('encodeGetEntitiesRequest', () => {
  it('should encode GetEntitiesRequest', () => {
    const request: GetEntitiesRequest = {
      limit: 2,
      offset: 1,
      filter: {
        'metadata.name': 'search',
        'spec.type': 'backend-plugin',
      },
      orderFields: [
        { field: 'metadata.title', order: 'desc' },
        { field: 'metadata.name', order: 'asc' },
      ],
      fullTextFilter: {
        term: 'search',
      },
    };

    const encodedParams = encodeGetEntitiesRequest(request).toString();
    expect(encodedParams).toBe(
      'limit=2&offset=1&filter=metadata.name%3Dsearch&filter=spec.type%3Dbackend-plugin&orderFields=metadata.title%2Cdesc&orderFields=metadata.name%2Casc&fullTextTerm=search',
    );
  });
});

describe('encodeGetEntityFacetsRequest', () => {
  it('should handle empty facet array', () => {
    const request: GetEntityFacetsRequest = {
      facets: [],
    };
    const params = encodeGetEntityFacetsRequest(request).toString();
    expect(params).toBe('');
  });

  it('should encode single facet', () => {
    const request: GetEntityFacetsRequest = {
      facets: ['spec.categories'],
    };
    const params = encodeGetEntityFacetsRequest(request).toString();
    expect(params).toBe('facet=spec.categories');
  });

  it('should encode multiple facets', () => {
    const request: GetEntityFacetsRequest = {
      facets: ['spec.categories', 'spec.owner'],
    };
    const params = encodeGetEntityFacetsRequest(request).toString();
    expect(params).toBe('facet=spec.categories&facet=spec.owner');
  });

  it('should encode facets with filter', () => {
    const request: GetEntityFacetsRequest = {
      facets: ['spec.categories', 'spec.owner'],
      filter: {
        'spec.category': 'CI/CD',
      },
    };
    const params = encodeGetEntityFacetsRequest(request).toString();
    expect(params).toBe(
      'facet=spec.categories&facet=spec.owner&filter=spec.category%3DCI%2FCD',
    );
  });
});
