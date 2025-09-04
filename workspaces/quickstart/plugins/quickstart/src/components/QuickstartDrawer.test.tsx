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

import { screen, fireEvent } from '@testing-library/react';
import {
  mockApis,
  renderInTestApp,
  TestApiProvider,
} from '@backstage/test-utils';
import { configApiRef } from '@backstage/core-plugin-api';
import { QuickstartDrawer } from './QuickstartDrawer';
import { useQuickstartDrawerContext } from '../hooks/useQuickstartDrawerContext';
import { useQuickstartRole } from '../hooks/useQuickstartRole';
import { mockQuickstartItems } from './mockData';

jest.mock('../hooks/useQuickstartDrawerContext', () => ({
  useQuickstartDrawerContext: jest.fn(),
}));

jest.mock('../hooks/useQuickstartRole', () => ({
  useQuickstartRole: jest.fn(),
}));

const mockUseQuickstartRole = useQuickstartRole as jest.MockedFunction<
  typeof useQuickstartRole
>;

describe('QuickstartDrawer', () => {
  const mockCloseDrawer = jest.fn();

  const mockContext = {
    isDrawerOpen: true,
    closeDrawer: mockCloseDrawer,
    drawerWidth: 320,
  };

  const mockConfigApi = mockApis.config({
    data: {
      app: {
        quickstart: mockQuickstartItems as any,
      },
      permission: {
        enabled: false, // Disable RBAC by default, returns admin role
      },
    },
  });

  // Helper functions to reduce duplication
  const expectAdminItems = () => {
    expect(screen.getByText('Step 1 for Admin')).toBeInTheDocument();
    expect(screen.getByText('Step 2 for Admin')).toBeInTheDocument();
    expect(screen.getByText('Step 1 - No Roles Assigned')).toBeInTheDocument();
    expect(screen.getByText('Step 2 - No Roles Assigned')).toBeInTheDocument();
  };

  const expectNoDeveloperItems = () => {
    expect(screen.queryByText('Step 1 for Developer')).not.toBeInTheDocument();
    expect(screen.queryByText('Step 2 for Developer')).not.toBeInTheDocument();
  };

  const expectDeveloperItems = () => {
    expect(screen.getByText('Step 1 for Developer')).toBeInTheDocument();
    expect(screen.getByText('Step 2 for Developer')).toBeInTheDocument();
  };

  const expectNoAdminItems = () => {
    expect(screen.queryByText('Step 1 for Admin')).not.toBeInTheDocument();
    expect(screen.queryByText('Step 2 for Admin')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Step 1 - No Roles Assigned'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Step 2 - No Roles Assigned'),
    ).not.toBeInTheDocument();
  };

  const expectCommonFooterElements = () => {
    expect(screen.getByText('Not started')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide' })).toBeInTheDocument();
  };

  const expectEmptyState = () => {
    expect(
      screen.getByText('Quickstart content not available for your role.'),
    ).toBeInTheDocument();
    expectCommonFooterElements();
  };

  const mockUserRole = (userRole: 'admin' | 'developer', isLoading = false) => {
    mockUseQuickstartRole.mockReturnValue({ isLoading, userRole });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useQuickstartDrawerContext as jest.Mock).mockReturnValue(mockContext);
    // Default: Return admin role (not loading)
    mockUserRole('admin');
  });

  const renderWithApi = async (configApi = mockConfigApi) => {
    return renderInTestApp(
      <TestApiProvider apis={[[configApiRef, configApi]]}>
        <QuickstartDrawer />
      </TestApiProvider>,
    );
  };

  it('renders the drawer and Quickstart with admin items', async () => {
    expect.hasAssertions();
    await renderWithApi();

    // Since RBAC is disabled, user should have admin role (platform engineers setting up RHDH)
    expectAdminItems();
    expectNoDeveloperItems();
    expectCommonFooterElements();
  });

  it('calls closeDrawer when Hide button is clicked', async () => {
    await renderWithApi();
    fireEvent.click(screen.getByRole('button', { name: 'Hide' }));
    expect(mockCloseDrawer).toHaveBeenCalledTimes(1);
  });

  it('renders drawer in closed state but keeps children mounted (persistent)', async () => {
    (useQuickstartDrawerContext as jest.Mock).mockReturnValue({
      ...mockContext,
      isDrawerOpen: false,
    });

    const { container } = await renderWithApi();

    const drawerRoot = container.querySelector('.v5-MuiDrawer-root');
    expect(drawerRoot).toBeInTheDocument();

    const drawerPaper = container.querySelector('.v5-MuiDrawer-paper');
    expect(drawerPaper).toBeInTheDocument();

    // Admin items should still be rendered (persistent drawer, RBAC disabled = admin role)
    expect(screen.getByText('Step 1 for Admin')).toBeInTheDocument();

    expect(drawerPaper).toHaveStyle('visibility: hidden');
  });

  it('renders developer items when user has developer role', async () => {
    expect.hasAssertions();
    mockUserRole('developer');

    await renderWithApi();

    // Since user has developer role (RBAC enabled + not allowed), only developer items should show
    expectDeveloperItems();
    expectNoAdminItems();
    expectCommonFooterElements();
  });

  it('renders empty state when no items match user role', async () => {
    expect.hasAssertions();
    // Create config with only admin items, but user has developer role
    const adminOnlyConfigApi = mockApis.config({
      data: {
        app: {
          quickstart: mockQuickstartItems.filter(item =>
            item.roles?.includes('admin'),
          ) as any,
        },
      },
    });

    mockUserRole('developer');

    await renderWithApi(adminOnlyConfigApi);

    // Since user has developer role but only admin items exist, should show empty state
    expectEmptyState();
  });

  it('renders admin items when user has admin role', async () => {
    expect.hasAssertions();
    // Mock the hook to return admin role (default already, but explicit for clarity)
    mockUserRole('admin');

    await renderWithApi();

    // Admin should see admin items and no developer items
    expectAdminItems();
    expectNoDeveloperItems();
  });

  it('handles empty config gracefully', async () => {
    expect.hasAssertions();
    const emptyConfigApi = mockApis.config({
      data: {
        app: {
          quickstart: [] as any,
        },
        permission: {
          enabled: false,
        },
      },
    });

    await renderWithApi(emptyConfigApi);

    expectEmptyState();
  });

  it('handles missing quickstart config gracefully', async () => {
    expect.hasAssertions();
    const noQuickstartConfigApi = mockApis.config({
      data: {
        app: {},
        permission: {
          enabled: false,
        },
      },
    });

    await renderWithApi(noQuickstartConfigApi);

    expectEmptyState();
  });
});
