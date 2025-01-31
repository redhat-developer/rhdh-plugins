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
  GetPluginsRequest,
  SortOrder,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import {
  encodeFilterParams,
  encodeFacetParams,
  encodeQueryParams,
  encodeGetPluginsQueryParams,
  encodeOrderFieldsParams,
} from './encodeQueryParams';
import { EntityOrderQuery } from '@backstage/catalog-client/index';

describe('encodeFilterParams', () => {
  it('should encode single orderFields correctly', () => {
    const orderFields: EntityOrderQuery = {
      field: 'metadata.title',
      order: 'asc' as SortOrder,
    };
    const params = encodeOrderFieldsParams(orderFields).toString();
    expect(params).toBe('orderFields=metadata.title%2Casc');
  });

  it('should encode multiple orderFields correctly', () => {
    const orderFields: EntityOrderQuery = [
      { field: 'metadata.title', order: 'desc' },
      { field: 'metadata.name', order: 'asc' },
    ];
    const params = encodeOrderFieldsParams(orderFields).toString();
    expect(params).toBe(
      'orderFields=metadata.title%2Cdesc&orderFields=metadata.name%2Casc',
    );
  });

  it('should encode GetPluginsRequest correctly', () => {
    const params: GetPluginsRequest = {
      filter: {
        'metadata.name': 'search',
        'spec.type': 'backend-plugin',
      },
      orderFields: [
        { field: 'metadata.title', order: 'desc' },
        { field: 'metadata.name', order: 'asc' },
      ],
      searchTerm: 'search',
      limit: 2,
      offset: 1,
    };

    const encodedParams = encodeGetPluginsQueryParams(params).toString();
    expect(encodedParams).toBe(
      'limit=2&offset=1&searchTerm=search&orderFields=metadata.title%2Cdesc&orderFields=metadata.name%2Casc&filter=metadata.name%3Dsearch&filter=spec.type%3Dbackend-plugin',
    );
  });

  it('should encode single filter correctly', () => {
    const filter: EntityFilterQuery = { kind: 'component' };
    const params = encodeFilterParams(filter).toString();
    expect(params).toBe('filter=kind%3Dcomponent');
  });

  it('should encode multiple filters correctly', () => {
    const filter = { kind: ['plugin', 'pluginlist'], 'spec.owner': 'admin' };
    const params = encodeFilterParams(filter).toString();
    expect(params).toBe(
      'filter=kind%3Dplugin&filter=kind%3Dpluginlist&filter=spec.owner%3Dadmin',
    );
  });

  it('should handle empty filter object', () => {
    const filter = {};
    const params = encodeFilterParams(filter).toString();
    expect(params).toBe('');
  });
});

describe('encodeFacetParams', () => {
  it('should encode single facet correctly', () => {
    const facets = ['kind'];
    const params = encodeFacetParams(facets).toString();
    expect(params).toBe('facet=kind');
  });

  it('should encode multiple facets correctly', () => {
    const facets = ['kind', 'spec.owner'];
    const params = encodeFacetParams(facets).toString();
    expect(params).toBe('facet=kind&facet=spec.owner');
  });

  it('should handle empty facet array', () => {
    const facets: string[] = [];
    const params = encodeFacetParams(facets).toString();
    expect(params).toBe('');
  });
});

describe('encodeQueryParams', () => {
  it('should encode filters and facets together', () => {
    const filter = { kind: ['plugin', 'pluginlist'], 'spec.owner': 'admin' };
    const facets = ['kind', 'spec.type'];
    const params = encodeQueryParams({ filter, facets });
    expect(params).toBe(
      'filter=kind%3Dplugin&filter=kind%3Dpluginlist&filter=spec.owner%3Dadmin&facet=kind&facet=spec.type',
    );
  });

  it('should handle only filters', () => {
    const filter = { kind: 'plugin' };
    const params = encodeQueryParams({ filter });
    expect(params).toBe('filter=kind%3Dplugin');
  });

  it('should handle only facets', () => {
    const facets = ['kind'];
    const params = encodeQueryParams({ facets });
    expect(params).toBe('facet=kind');
  });

  it('should handle empty input', () => {
    const params = encodeQueryParams();
    expect(params).toBe('');
  });
});
