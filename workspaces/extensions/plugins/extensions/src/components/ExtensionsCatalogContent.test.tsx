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
import { renderInTestApp } from '@backstage/test-utils';
import { ExtensionsCatalogContent } from './ExtensionsCatalogContent';
import { useFilteredPlugins } from '../hooks/useFilteredPlugins';
import { useCollections } from '../hooks/useCollections';
import { useExtensionsConfiguration } from '../hooks/useExtensionsConfiguration';
import { mockPlugins } from '../__fixtures__/mockPlugins';

const useFilteredPluginsMock = useFilteredPlugins as jest.Mock;
const useCollectionsMock = useCollections as jest.Mock;
const useExtensionsConfigurationMock = useExtensionsConfiguration as jest.Mock;

jest.mock('../hooks/useCollections', () => ({
  useCollections: jest.fn(),
}));

jest.mock('../hooks/useExtensionsConfiguration', () => ({
  useExtensionsConfiguration: jest.fn(),
}));

jest.mock('../hooks/useNodeEnvironment', () => ({
  useNodeEnvironment: jest.fn(),
}));

jest.mock('../hooks/useFilteredPlugins', () => ({
  useFilteredPlugins: jest.fn(),
}));

jest.mock('../hooks/usePluginFacet', () => ({
  usePluginFacet: jest.fn().mockReturnValue({
    data: [],
  }),
}));

jest.mock('../hooks/usePluginFacets', () => ({
  usePluginFacets: jest.fn().mockReturnValue({
    data: [],
  }),
}));

jest.mock('../hooks/useFilteredPluginFacet', () => ({
  useFilteredPluginFacet: jest.fn().mockReturnValue({
    data: [],
  }),
}));

jest.mock('../hooks/useFilteredSupportTypes', () => ({
  useFilteredSupportTypes: jest.fn().mockReturnValue({
    data: [],
  }),
}));

afterAll(() => {
  jest.clearAllMocks();
});

describe('ExtensionsCatalogContent', () => {
  it('should show empty state with no plugins', async () => {
    useExtensionsConfigurationMock.mockReturnValue({
      data: {
        enabled: false,
      },
    });
    useFilteredPluginsMock.mockReturnValue({
      data: {
        totalItems: 0,
      },
    });

    const { getByText } = await renderInTestApp(<ExtensionsCatalogContent />);
    expect(getByText('No plugins found')).toBeInTheDocument();
  });

  it('should show empty state when filters return no results', async () => {
    useExtensionsConfigurationMock.mockReturnValue({
      data: {
        enabled: false,
      },
    });
    useCollectionsMock.mockReturnValue({
      data: {
        featuredCollections: [],
      },
    });
    useFilteredPluginsMock.mockReturnValue({
      data: {
        totalItems: 10,
        items: mockPlugins,
        filteredItems: 0,
      },
    });

    const { getByText } = await renderInTestApp(<ExtensionsCatalogContent />);
    expect(
      getByText('No results found. Adjust your filters and try again.'),
    ).toBeInTheDocument();
  });

  it('should show empty state with no extensions backend found', async () => {
    useFilteredPluginsMock.mockReturnValue({
      error: {
        message: '404',
      },
    });

    const { getByText } = await renderInTestApp(<ExtensionsCatalogContent />);
    expect(
      getByText('Must enable the Extensions backend plugin'),
    ).toBeInTheDocument();
  });
});
