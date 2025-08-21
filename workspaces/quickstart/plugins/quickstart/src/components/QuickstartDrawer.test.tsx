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
import { mockQuickstartItems } from './mockData';

jest.mock('../hooks/useQuickstartDrawerContext', () => ({
  useQuickstartDrawerContext: jest.fn(),
}));

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
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useQuickstartDrawerContext as jest.Mock).mockReturnValue(mockContext);
  });

  const renderWithApi = async () => {
    return renderInTestApp(
      <TestApiProvider apis={[[configApiRef, mockConfigApi]]}>
        <QuickstartDrawer />
      </TestApiProvider>,
    );
  };

  it('renders the drawer and Quickstart with developer items', async () => {
    await renderWithApi();

    // Since userRole is hardcoded to 'developer', only developer items should be shown
    expect(screen.getByText('Step 1 for Developer')).toBeInTheDocument();
    expect(screen.getByText('Step 2 for Developer')).toBeInTheDocument();

    // Admin items should not be visible
    expect(screen.queryByText('Step 1 for Admin')).not.toBeInTheDocument();
    expect(screen.queryByText('Step 2 for Admin')).not.toBeInTheDocument();

    expect(screen.getByText('Not started')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide' })).toBeInTheDocument();
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

    // Developer items should still be rendered (persistent drawer)
    expect(screen.getByText('Step 1 for Developer')).toBeInTheDocument();

    expect(drawerPaper).toHaveStyle('visibility: hidden');
  });

  it('renders empty state when no items match user role', async () => {
    // Create config with only admin items - developer role should show empty state
    const adminOnlyConfigApi = mockApis.config({
      data: {
        app: {
          quickstart: mockQuickstartItems.filter(
            item => item.roles?.includes('admin') || !item.roles,
          ) as any,
        },
      },
    });

    await renderInTestApp(
      <TestApiProvider apis={[[configApiRef, adminOnlyConfigApi]]}>
        <QuickstartDrawer />
      </TestApiProvider>,
    );

    // Since component uses developer role, it should show empty state for admin-only items
    expect(
      screen.getByText('Quickstart content not available for your role.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Not started')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide' })).toBeInTheDocument();
  });

  it('handles empty config gracefully', async () => {
    const emptyConfigApi = mockApis.config({
      data: {
        app: {
          quickstart: [] as any,
        },
      },
    });

    await renderInTestApp(
      <TestApiProvider apis={[[configApiRef, emptyConfigApi]]}>
        <QuickstartDrawer />
      </TestApiProvider>,
    );

    expect(
      screen.getByText('Quickstart content not available for your role.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Not started')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide' })).toBeInTheDocument();
  });

  it('handles missing quickstart config gracefully', async () => {
    const noQuickstartConfigApi = mockApis.config({
      data: {
        app: {},
      },
    });

    await renderInTestApp(
      <TestApiProvider apis={[[configApiRef, noQuickstartConfigApi]]}>
        <QuickstartDrawer />
      </TestApiProvider>,
    );

    expect(
      screen.getByText('Quickstart content not available for your role.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Not started')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide' })).toBeInTheDocument();
  });
});
