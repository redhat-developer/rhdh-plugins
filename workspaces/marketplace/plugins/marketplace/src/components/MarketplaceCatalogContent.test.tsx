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
import React from 'react';
import { renderInTestApp } from '@backstage/test-utils';
import { MarketplaceCatalogContent } from './MarketplaceCatalogContent';
import { useFilteredPlugins } from '../hooks/useFilteredPlugins';

const useFilteredPluginsMock = useFilteredPlugins as jest.Mock;

jest.mock('../hooks/useCollections', () => ({
  useCollections: jest.fn(),
}));

jest.mock('../hooks/useFilteredPlugins', () => ({
  useFilteredPlugins: jest.fn(),
}));

describe('MarketplaceCatalogContent', () => {
  it('should show empty state with no plugins', async () => {
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
