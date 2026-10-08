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

import { renderInTestApp } from '@backstage/test-utils';
import { configApiRef } from '@backstage/core-plugin-api';
import { TestApiProvider } from '@backstage/test-utils';
import { MockConfigApi } from '@backstage/test-utils';

import { ExtensionsPluginFilter } from './ExtensionsPluginFilter';
import { useFilteredPluginFacet } from '../hooks/useFilteredPluginFacet';
import { useFilteredSupportTypes } from '../hooks/useFilteredSupportTypes';

const useFilteredPluginFacetMock = useFilteredPluginFacet as jest.Mock;
const useFilteredSupportTypesMock = useFilteredSupportTypes as jest.Mock;

jest.mock('../hooks/useFilteredPluginFacet', () => ({
  useFilteredPluginFacet: jest.fn(),
}));

jest.mock('../hooks/useFilteredSupportTypes', () => ({
  useFilteredSupportTypes: jest.fn().mockReturnValue({
    data: [],
  }),
}));

const mockConfigWithSources = new MockConfigApi({
  extensions: {
    catalogSources: {
      primary: {
        label: 'Red Hat',
        description: 'Plugins provided and supported by Red Hat',
        badge: 'Red Hat',
      },
      community: {
        label: 'Community',
        description: 'Community-maintained plugins',
        badge: 'Community',
      },
    },
  },
});

const mockConfigEmpty = new MockConfigApi({});

describe('CatalogSourceFilter', () => {
  beforeEach(() => {
    useFilteredSupportTypesMock.mockReturnValue({ data: [] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render catalog source filter with two sources', async () => {
    useFilteredPluginFacetMock.mockImplementation(
      (facet: string, _exclude?: string) => {
        if (facet === 'metadata.annotations.catalog-source') {
          return {
            data: [
              { value: 'primary', count: 5 },
              { value: 'community', count: 3 },
            ],
          };
        }
        return { data: [] };
      },
    );

    const { getByText } = await renderInTestApp(
      <TestApiProvider apis={[[configApiRef, mockConfigWithSources]]}>
        <ExtensionsPluginFilter />
      </TestApiProvider>,
    );

    expect(getByText('Catalog source')).toBeInTheDocument();
  });

  it('should not render catalog source filter when no sources exist', async () => {
    useFilteredPluginFacetMock.mockReturnValue({ data: [] });

    const { queryByText } = await renderInTestApp(
      <TestApiProvider apis={[[configApiRef, mockConfigEmpty]]}>
        <ExtensionsPluginFilter />
      </TestApiProvider>,
    );

    expect(queryByText('Catalog source')).not.toBeInTheDocument();
  });

  it('should display config labels instead of raw annotation values', async () => {
    useFilteredPluginFacetMock.mockImplementation(
      (facet: string, _exclude?: string) => {
        if (facet === 'metadata.annotations.catalog-source') {
          return {
            data: [
              { value: 'primary', count: 5 },
              { value: 'community', count: 3 },
            ],
          };
        }
        return { data: [] };
      },
    );

    const { getByText } = await renderInTestApp(
      <TestApiProvider apis={[[configApiRef, mockConfigWithSources]]}>
        <ExtensionsPluginFilter />
      </TestApiProvider>,
    );

    expect(getByText('Catalog source')).toBeInTheDocument();
  });

  it('should fall back to raw annotation value when source is not configured', async () => {
    useFilteredPluginFacetMock.mockImplementation(
      (facet: string, _exclude?: string) => {
        if (facet === 'metadata.annotations.catalog-source') {
          return {
            data: [{ value: 'unconfigured-source', count: 2 }],
          };
        }
        return { data: [] };
      },
    );

    const { getByText } = await renderInTestApp(
      <TestApiProvider apis={[[configApiRef, mockConfigEmpty]]}>
        <ExtensionsPluginFilter />
      </TestApiProvider>,
    );

    expect(getByText('Catalog source')).toBeInTheDocument();
  });
});
