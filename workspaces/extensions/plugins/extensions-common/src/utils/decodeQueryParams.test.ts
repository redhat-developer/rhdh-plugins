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
  GetEntityFacetsRequest,
} from '@backstage/catalog-client';

import { GetEntitiesRequest } from '../api';

import {
  decodeEntityFilterQuery,
  decodeEntityOrderQuery,
  decodeGetEntitiesRequest,
  decodeGetEntityFacetsRequest,
} from './decodeQueryParams';

describe('decodeEntityFilterQuery', () => {
  it('should decode no filter', () => {
    const searchParams = new URLSearchParams();
    expect(decodeEntityFilterQuery(searchParams)).toBe(undefined);
  });

  it('should decode single filter', () => {
    const searchParams = new URLSearchParams('filter=spec.category%3DCI%2FCD');
    const expectedRequest: EntityFilterQuery = {
      'spec.category': 'CI/CD',
    };
    expect(decodeEntityFilterQuery(searchParams)).toEqual(expectedRequest);
  });

  it('should decode multiple filters', () => {
    const searchParams = new URLSearchParams(
      'filter=spec.category%3DCI&filter=spec.category%3DCD&filter=spec.owner%3Dadmin',
    );
    const expectedRequest: EntityFilterQuery = {
      'spec.category': ['CI', 'CD'],
      'spec.owner': 'admin',
    };
    expect(decodeEntityFilterQuery(searchParams)).toEqual(expectedRequest);
  });
});

describe('decodeEntityOrderQuery', () => {
  it('should work without orderFields', () => {
    const searchParams = new URLSearchParams();
    expect(decodeEntityOrderQuery(searchParams)).toBe(undefined);
  });

  it('should decode single orderFields', () => {
    const searchParams = new URLSearchParams(
      'orderFields=metadata.title%2Casc',
    );
    expect(decodeEntityOrderQuery(searchParams)).toEqual([
      { field: 'metadata.title', order: 'asc' },
    ]);
  });

  it('should decode multiple orderFields', () => {
    const searchParams = new URLSearchParams(
      'orderFields=metadata.title%2Cdesc&orderFields=metadata.name%2Casc',
    );
    expect(decodeEntityOrderQuery(searchParams)).toEqual([
      { field: 'metadata.title', order: 'desc' },
      { field: 'metadata.name', order: 'asc' },
    ]);
  });
});

describe('decodeGetEntitiesRequest', () => {
  it('should decode GetEntitiesRequest', () => {
    const encodedString = new URLSearchParams(
      'limit=2&offset=1&filter=metadata.name%3Dsearch&filter=spec.type%3Dbackend-plugin&orderFields=metadata.title%2Cdesc&orderFields=metadata.name%2Casc&fullTextTerm=search',
    );
    const expectedRequest: GetEntitiesRequest = {
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
    expect(decodeGetEntitiesRequest(encodedString)).toEqual(expectedRequest);
  });
});

describe('decodeGetEntityFacetsRequest', () => {
  it('should handle no facet param', () => {
    const searchParams = new URLSearchParams('');
    const expectedRequest: GetEntityFacetsRequest = {
      facets: [],
    };
    const request = decodeGetEntityFacetsRequest(searchParams);
    expect(request).toEqual(expectedRequest);
  });

  it('should encode single facet', () => {
    const searchParams = new URLSearchParams('facet=spec.categories');
    const expectedRequest: GetEntityFacetsRequest = {
      facets: ['spec.categories'],
    };
    const request = decodeGetEntityFacetsRequest(searchParams);
    expect(request).toEqual(expectedRequest);
  });

  it('should encode multiple facets', () => {
    const searchParams = new URLSearchParams(
      'facet=spec.categories&facet=spec.owner',
    );
    const expectedRequest: GetEntityFacetsRequest = {
      facets: ['spec.categories', 'spec.owner'],
    };
    const request = decodeGetEntityFacetsRequest(searchParams);
    expect(request).toEqual(expectedRequest);
  });

  it('should encode facets with filter', () => {
    const searchParams = new URLSearchParams(
      'facet=spec.categories&facet=spec.owner&filter=spec.category%3DCI%2FCD',
    );
    const expectedRequest: GetEntityFacetsRequest = {
      facets: ['spec.categories', 'spec.owner'],
      filter: {
        'spec.category': 'CI/CD',
      },
    };
    const request = decodeGetEntityFacetsRequest(searchParams);
    expect(request).toEqual(expectedRequest);
  });
});
