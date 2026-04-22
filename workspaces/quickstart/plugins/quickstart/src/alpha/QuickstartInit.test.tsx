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

import { waitFor } from '@testing-library/react';
import {
  mockApis,
  renderInTestApp,
  TestApiProvider,
} from '@backstage/test-utils';
import { configApiRef, identityApiRef } from '@backstage/core-plugin-api';
import { QuickstartInit } from './QuickstartInit';
import { QUICKSTART_DRAWER_ID } from './const';

const mockOpenDrawer = jest.fn();
const mockCloseDrawer = jest.fn();
const mockIsOpen = jest.fn();

jest.mock('@red-hat-developer-hub/backstage-plugin-app-react', () => ({
  useAppDrawer: () => ({
    isOpen: mockIsOpen,
    openDrawer: mockOpenDrawer,
    closeDrawer: mockCloseDrawer,
    toggleDrawer: jest.fn(),
    activeDrawerId: null,
    getWidth: () => 500,
    setWidth: jest.fn(),
  }),
}));

jest.mock('../hooks/useQuickstartRole', () => ({
  useQuickstartRole: jest.fn(() => ({
    isLoading: false,
    userRole: 'admin',
  })),
}));

const mockIdentityApi = {
  getBackstageIdentity: jest.fn().mockResolvedValue({
    userEntityRef: 'user:default/guest',
    ownershipEntityRefs: [],
  }),
  getCredentials: jest.fn().mockResolvedValue({ token: undefined }),
  getProfileInfo: jest.fn().mockResolvedValue({}),
  signOut: jest.fn(),
};

describe('QuickstartInit', () => {
  const configApi = mockApis.config({
    data: {
      app: {
        quickstart: [
          {
            title: 'Admin Step',
            roles: ['admin'],
            steps: [{ title: 'Do something', description: 'desc' }],
          },
        ],
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockIsOpen.mockReturnValue(false);
  });

  const renderComponent = () =>
    renderInTestApp(
      <TestApiProvider
        apis={[
          [configApiRef, configApi],
          [identityApiRef, mockIdentityApi],
        ]}
      >
        <QuickstartInit />
      </TestApiProvider>,
    );

  it('auto-opens the drawer on first visit', async () => {
    await renderComponent();

    await waitFor(() => {
      expect(mockOpenDrawer).toHaveBeenCalledWith(QUICKSTART_DRAWER_ID);
    });

    expect(localStorage.getItem('quickstart-visited:user:default/guest')).toBe(
      'true',
    );
    expect(localStorage.getItem('quickstart-open:user:default/guest')).toBe(
      'true',
    );
  });

  it('does not auto-open when user has already visited', async () => {
    localStorage.setItem('quickstart-visited:user:default/guest', 'true');
    localStorage.setItem('quickstart-open:user:default/guest', 'false');

    await renderComponent();

    await waitFor(() => {
      expect(
        localStorage.getItem('quickstart-visited:user:default/guest'),
      ).toBe('true');
    });

    expect(mockOpenDrawer).not.toHaveBeenCalled();
  });

  it('re-opens the drawer when previously left open', async () => {
    localStorage.setItem('quickstart-visited:user:default/guest', 'true');
    localStorage.setItem('quickstart-open:user:default/guest', 'true');

    await renderComponent();

    await waitFor(() => {
      expect(mockOpenDrawer).toHaveBeenCalledWith(QUICKSTART_DRAWER_ID);
    });
  });
});
