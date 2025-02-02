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
import { GetPluginsRequest } from '../types';
import {
  decodeFacetParams,
  decodeFilterParams,
  decodeQueryParams,
  decodeGetPluginsRequest,
  decodeOrderFields,
} from './decodeQueryParams';

describe('decodeFilterParams', () => {
  it('should decode single orderFields', () => {
    const searchParams = new URLSearchParams(
      'orderFields=metadata.title%2Casc',
    );
    expect(decodeOrderFields(searchParams)).toEqual([
      { field: 'metadata.title', order: 'asc' },
    ]);
  });

  it('should decode multiple orderFields', () => {
    const searchParams = new URLSearchParams(
      'orderFields=metadata.title%2Cdesc&orderFields=metadata.name%2Casc',
    );
    expect(decodeOrderFields(searchParams)).toEqual([
      { field: 'metadata.title', order: 'desc' },
      { field: 'metadata.name', order: 'asc' },
    ]);
  });

  it('should decode GetPlugins Request', () => {
    const encodedString =
      'filter=metadata.name%3Dsearch&filter=spec.type%3Dbackend-plugin&orderFields=metadata.title%2Cdesc&orderFields=metadata.name%2Casc&searchTerm=search&limit=2&offset=1';
    const params: GetPluginsRequest = {
      filter: {
        'metadata.name': ['search'],
        'spec.type': ['backend-plugin'],
      },
      orderFields: [
        { field: 'metadata.title', order: 'desc' },
        { field: 'metadata.name', order: 'asc' },
      ],
      searchTerm: 'search',
      limit: 2,
      offset: 1,
    };
    expect(decodeGetPluginsRequest(encodedString)).toEqual(params);
  });

  it('should decode single filter', () => {
    const searchParams = new URLSearchParams('filter=kind%3Dplugin');
    expect(decodeFilterParams(searchParams)).toEqual({ kind: ['plugin'] });
  });

  it('should decode multiple filters', () => {
    const searchParams = new URLSearchParams(
      'filter=kind%3Dplugin&filter=kind%3Dpluginlist&filter=spec.owner%3Dadmin',
    );
    expect(decodeFilterParams(searchParams)).toEqual({
      kind: ['plugin', 'pluginlist'],
      'spec.owner': ['admin'],
    });
  });

  it('should return empty object for no filter', () => {
    const searchParams = new URLSearchParams('');
    expect(decodeFilterParams(searchParams)).toEqual({});
  });
});

describe('decodeFacetParams', () => {
  it('should decode single facet', () => {
    const searchParams = new URLSearchParams('facet=kind');
    expect(decodeFacetParams(searchParams)).toEqual(['kind']);
  });

  it('should decode multiple facets', () => {
    const searchParams = new URLSearchParams('facet=kind&facet=spec.owner');
    expect(decodeFacetParams(searchParams)).toEqual(['kind', 'spec.owner']);
  });

  it('should return empty array for no facet', () => {
    const searchParams = new URLSearchParams('');
    expect(decodeFacetParams(searchParams)).toEqual([]);
  });
});

describe('decodeQueryParams', () => {
  it('should decode filters and facets together', () => {
    const queryString =
      'filter=kind%3Dplugin&filter=kind%3Dpluginlist&filter=spec.owner%3Dadmin&facet=kind&facet=spec.owner';
    expect(decodeQueryParams(queryString)).toEqual({
      filter: {
        kind: ['plugin', 'pluginlist'],
        'spec.owner': ['admin'],
      },
      facets: ['kind', 'spec.owner'],
    });
  });

  it('should return only filters', () => {
    const queryString = 'filter=kind%3Dplugin';
    expect(decodeQueryParams(queryString)).toEqual({
      filter: { kind: ['plugin'] },
    });
  });

  it('should return only facets', () => {
    const queryString = 'facet=kind';
    expect(decodeQueryParams(queryString)).toEqual({
      facets: ['kind'],
    });
  });

  it('should handle empty query', () => {
    expect(decodeQueryParams('')).toEqual({});
  });
});
