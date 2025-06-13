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
import { MarketplaceCatalogContent } from './MarketplaceCatalogContent';
import { useFilteredPlugins } from '../hooks/useFilteredPlugins';
import { useExtensionsConfiguration } from '../hooks/useExtensionsConfiguration';

const useFilteredPluginsMock = useFilteredPlugins as jest.Mock;
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

afterAll(() => {
  jest.clearAllMocks();
});

describe('MarketplaceCatalogContent', () => {
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

    const { getByText } = await renderInTestApp(<MarketplaceCatalogContent />);
    expect(getByText('No plugins found')).toBeInTheDocument();
  });

  it('should show empty state with no extensions backend found', async () => {
    useFilteredPluginsMock.mockReturnValue({
      error: {
        message: '404',
      },
    });

    const { getByText } = await renderInTestApp(<MarketplaceCatalogContent />);
    expect(
      getByText('Must enable the Extensions backend plugin'),
    ).toBeInTheDocument();
  });
});
