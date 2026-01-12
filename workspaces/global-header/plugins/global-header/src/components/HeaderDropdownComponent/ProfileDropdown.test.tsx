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
import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { CatalogApi } from '@backstage/catalog-client';
import { useUserProfile } from '@backstage/plugin-user-settings';
import { catalogApiRef } from '@backstage/plugin-catalog-react';

import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import {
  MockTrans,
  mockUseTranslation,
} from '../../test-utils/mockTranslations';
import { ProfileDropdown } from './ProfileDropdown';

jest.mock('@backstage/plugin-user-settings', () => ({
  useUserProfile: jest.fn(),
}));

// Mock translation hooks
jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

jest.mock('../../components/Trans', () => ({
  Trans: MockTrans,
}));

jest.mock('../../hooks/useProfileDropdownMountPoints', () => {
  const MockComponent = ({ title }: { title: string }) => <span>{title}</span>;
  return {
    useProfileDropdownMountPoints: () => [
      {
        Component: MockComponent,
        config: {
          props: {
            icon: 'manageAccounts',
            title: 'Settings',
            titleKey: 'profile.settings',
            link: '/settings',
          },
          priority: 200,
        },
      },
      {
        Component: MockComponent,
        config: {
          props: {
            icon: 'account',
            title: 'My profile',
            titleKey: 'profile.myProfile',
            type: 'myProfile',
          },
          priority: 150,
        },
      },
    ],
  };
});

const createMockCatalogApi = (entity: Partial<CatalogApi['getEntityByRef']>) =>
  ({
    getEntityByRef: jest.fn().mockResolvedValue(entity),
  } as unknown as CatalogApi);

const setUserProfileMock = ({
  displayName,
  userEntityRef,
}: {
  displayName: string;
  userEntityRef: string;
}) => {
  (useUserProfile as jest.Mock).mockReturnValue({
    displayName,
    backstageIdentity: { userEntityRef },
    profile: { picture: 'picture' },
    loading: false,
  });
};

const renderComponent = async (mockCatalogApi: CatalogApi) => {
  await renderInTestApp(
    <TestApiProvider apis={[[catalogApiRef, mockCatalogApi]]}>
      <ProfileDropdown />
    </TestApiProvider>,
  );
};

describe('ProfileDropdown', () => {
  it('should render the configured profile displayname', async () => {
    setUserProfileMock({
      displayName: 'Test User',
      userEntityRef: 'user:default/test-user',
    });

    const catalogApi = createMockCatalogApi({
      metadata: {
        name: 'test-user',
        title: 'Test User',
      },
      spec: {
        profile: { displayName: 'Test User DN' },
      },
    });

    await renderComponent(catalogApi);

    expect(screen.getByText(/Test User DN/i)).toBeInTheDocument();
  });

  it('should render the title if profile displayname is not configured', async () => {
    setUserProfileMock({
      displayName: 'testuser1',
      userEntityRef: 'user:default/test-user',
    });

    const catalogApi = createMockCatalogApi({
      metadata: {
        name: 'test-user',
        title: 'Test User',
      },
      spec: {},
    });

    await renderComponent(catalogApi);

    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
  });

  it('should render the user entity ref when user is not configured in the catalog', async () => {
    setUserProfileMock({
      displayName: 'user:default/test',
      userEntityRef: 'user:default/test',
    });

    const catalogApi = createMockCatalogApi({
      metadata: {
        name: 'test-user',
      },
      spec: {},
    });

    await renderComponent(catalogApi);

    expect(screen.getByText(/Test/i)).toBeInTheDocument();
  });

  it('should render the My Profile menu item with the correct dynamic link', async () => {
    setUserProfileMock({
      displayName: 'Test User',
      userEntityRef: 'user:default/test-user',
    });

    const catalogApi = createMockCatalogApi({
      metadata: {
        name: 'test-user',
        title: 'Test User',
      },
      spec: {
        profile: { displayName: 'Test User DN' },
      },
    });

    await renderComponent(catalogApi);
    const profileButton = screen.getByRole('button', {
      name: /Profile picture Test User DN/i,
    });
    fireEvent.click(profileButton);

    await waitFor(() => {
      const myProfileLink = screen.getByRole('menuitem', {
        name: /My profile/i,
      });
      expect(myProfileLink).toBeInTheDocument();
      expect(myProfileLink).toHaveAttribute(
        'href',
        '/catalog/default/user/test-user',
      );
    });
  });

  it('should hide My Profile menu item for guest users', async () => {
    setUserProfileMock({
      displayName: 'Guest',
      userEntityRef: 'user:development/guest',
    });

    const catalogApi = createMockCatalogApi({
      metadata: {
        name: 'guest',
        title: 'Guest',
      },
      spec: {
        profile: { displayName: 'Guest' },
      },
    });

    await renderComponent(catalogApi);
    const profileButton = screen.getByRole('button', {
      name: /Profile picture Guest/i,
    });
    fireEvent.click(profileButton);

    await waitFor(() => {
      // Should find Settings menu item
      const settingsLink = screen.getByRole('menuitem', {
        name: /Settings/i,
      });
      expect(settingsLink).toBeInTheDocument();

      // Should NOT find My Profile menu item for guest users
      const myProfileLink = screen.queryByRole('menuitem', {
        name: /My profile/i,
      });
      expect(myProfileLink).not.toBeInTheDocument();
    });
  });

  it('should hide My Profile menu item when catalog API fails', async () => {
    setUserProfileMock({
      displayName: 'Test User',
      userEntityRef: 'user:default/test-user',
    });

    // Mock catalog API to throw an error (user not found in catalog)
    const catalogApi = {
      getEntityByRef: jest.fn().mockRejectedValue(new Error('User not found')),
    } as unknown as CatalogApi;

    await renderComponent(catalogApi);
    const profileButton = screen.getByRole('button', {
      name: /Profile picture Test User/i,
    });
    fireEvent.click(profileButton);

    await waitFor(() => {
      // Should find Settings menu item
      const settingsLink = screen.getByRole('menuitem', {
        name: /Settings/i,
      });
      expect(settingsLink).toBeInTheDocument();

      // Should NOT find My Profile menu item when catalog API fails
      const myProfileLink = screen.queryByRole('menuitem', {
        name: /My profile/i,
      });
      expect(myProfileLink).not.toBeInTheDocument();
    });
  });
});
