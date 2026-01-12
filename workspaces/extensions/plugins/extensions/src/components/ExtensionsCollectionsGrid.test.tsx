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

import { useCollections } from '../hooks/useCollections';
import { useCollectionPlugins } from '../hooks/useCollectionPlugins';
import { rootRouteRef } from '../routes';

import { mockCollections } from '../__fixtures__/mockCollections';
import { mockPlugins } from '../__fixtures__/mockPlugins';

import { ExtensionsCollectionsGrid } from './ExtensionsCollectionsGrid';

const useCollectionsMock = useCollections as jest.Mock;
const useCollectionPluginsMock = useCollectionPlugins as jest.Mock;

jest.mock('../hooks/useCollections', () => ({
  useCollections: jest.fn(),
}));

jest.mock('../hooks/useCollectionPlugins', () => ({
  useCollectionPlugins: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ExtensionsCollectionsGrid', () => {
  it('should render while loading', async () => {
    useCollectionsMock.mockReturnValue({ isLoading: true });

    const { getAllByText } = await renderInTestApp(
      <ExtensionsCollectionsGrid />,
    );
    // find skeletons, exact number doesn't matter
    expect(getAllByText('Entry name')).toHaveLength(10);
  });

  it('should render fetched data', async () => {
    useCollectionsMock.mockReturnValue({
      isLoading: false,
      data: { items: mockCollections },
    });
    useCollectionPluginsMock.mockImplementation(
      (_namespace: string, name: string) => {
        if (name === 'collection-1') {
          return { isLoading: false, data: [mockPlugins[0]] };
        }
        if (name === 'collection-2') {
          return { isLoading: false, data: [mockPlugins[1]] };
        }
        return null;
      },
    );

    const { getByText } = await renderInTestApp(<ExtensionsCollectionsGrid />, {
      mountedRoutes: {
        '/extensions': rootRouteRef,
      },
    });
    expect(getByText('collection-1')).toBeInTheDocument();
    expect(getByText('plugin-1')).toBeInTheDocument();
    expect(getByText('Collection 2')).toBeInTheDocument();
    expect(getByText('Plugin 2')).toBeInTheDocument();
  });
});
