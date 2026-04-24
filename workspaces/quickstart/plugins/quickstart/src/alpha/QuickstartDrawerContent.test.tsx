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

import { screen } from '@testing-library/react';
import {
  mockApis,
  renderInTestApp,
  TestApiProvider,
} from '@backstage/test-utils';
import { configApiRef } from '@backstage/core-plugin-api';
import { QuickstartDrawerContent } from './QuickstartDrawerContent';
import { QUICKSTART_DRAWER_ID } from './const';

const mockCloseDrawer = jest.fn();
const mockIsOpen = jest.fn();

jest.mock('@red-hat-developer-hub/backstage-plugin-app-react', () => ({
  useAppDrawer: () => ({
    isOpen: mockIsOpen,
    closeDrawer: mockCloseDrawer,
    openDrawer: jest.fn(),
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

const { useQuickstartRole } = jest.requireMock('../hooks/useQuickstartRole');

describe('QuickstartDrawerContent', () => {
  const adminConfigApi = mockApis.config({
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

  const emptyConfigApi = mockApis.config({
    data: { app: {} },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockIsOpen.mockReturnValue(true);
    (useQuickstartRole as jest.Mock).mockReturnValue({
      isLoading: false,
      userRole: 'admin',
    });
  });

  const renderComponent = (configApi = adminConfigApi) =>
    renderInTestApp(
      <TestApiProvider apis={[[configApiRef, configApi]]}>
        <QuickstartDrawerContent />
      </TestApiProvider>,
    );

  it('renders quickstart items when drawer is open and user has eligible items', async () => {
    await renderComponent();

    expect(
      screen.getByText("Let's get you started with Developer Hub"),
    ).toBeInTheDocument();
  });

  it('returns null when no quickstart items are configured', async () => {
    const { container } = await renderComponent(emptyConfigApi);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when user role has no eligible items', async () => {
    (useQuickstartRole as jest.Mock).mockReturnValue({
      isLoading: false,
      userRole: 'developer',
    });

    const { container } = await renderComponent();
    expect(container.firstChild).toBeNull();
  });

  it('passes the correct drawer ID to isOpen', async () => {
    await renderComponent();
    expect(mockIsOpen).toHaveBeenCalledWith(QUICKSTART_DRAWER_ID);
  });
});
