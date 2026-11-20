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

import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';

import { MyProfileMenuItem } from './MyProfileMenuItem';
import { useIsCatalogAvailable } from '../hooks/useIsCatalogAvailable';
import { useUserIdentity } from '../hooks/useUserIdentity';

jest.mock('../hooks/useIsCatalogAvailable', () => ({
  useIsCatalogAvailable: jest.fn(),
}));

jest.mock('../hooks/useUserIdentity', () => ({
  useUserIdentity: jest.fn(),
}));

const mockUseIsCatalogAvailable = jest.mocked(useIsCatalogAvailable);
const mockUseUserIdentity = jest.mocked(useUserIdentity);

describe('MyProfileMenuItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders null when catalog is not available', async () => {
    mockUseIsCatalogAvailable.mockReturnValue(false);
    mockUseUserIdentity.mockReturnValue({
      backstageIdentity: {
        type: 'user',
        userEntityRef: 'user:default/john',
        ownershipEntityRefs: [],
      },
      profile: {},
      displayName: 'john',
      loading: false,
    });

    const { queryByRole } = await renderInTestApp(
      <TestApiProvider apis={[]}>
        <MyProfileMenuItem />
      </TestApiProvider>,
    );
    expect(queryByRole('menuitem')).not.toBeInTheDocument();
  });

  it('renders null for guest users even if catalog is available', async () => {
    mockUseIsCatalogAvailable.mockReturnValue(true);
    mockUseUserIdentity.mockReturnValue({
      backstageIdentity: {
        type: 'user',
        userEntityRef: 'user:development/guest',
        ownershipEntityRefs: [],
      },
      profile: {},
      displayName: 'Guest',
      loading: false,
    });

    const { queryByRole } = await renderInTestApp(
      <TestApiProvider apis={[]}>
        <MyProfileMenuItem />
      </TestApiProvider>,
    );
    expect(queryByRole('menuitem')).not.toBeInTheDocument();
  });

  it('renders profile link when user is non-guest and catalog is available', async () => {
    mockUseIsCatalogAvailable.mockReturnValue(true);
    mockUseUserIdentity.mockReturnValue({
      backstageIdentity: {
        type: 'user',
        userEntityRef: 'user:default/john',
        ownershipEntityRefs: [],
      },
      profile: {},
      displayName: 'john',
      loading: false,
    });

    const { getByRole } = await renderInTestApp(
      <TestApiProvider apis={[]}>
        <MyProfileMenuItem />
      </TestApiProvider>,
    );
    const menuItem = getByRole('menuitem');
    expect(menuItem).toBeInTheDocument();
    expect(menuItem.getAttribute('href')).toEqual('/catalog/default/user/john');
    expect(menuItem).toHaveTextContent('My profile');
  });
});
