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
        quickstart: [
          {
            title: 'Step 1',
            description: 'Description for Step 1',
            icon: 'bolt',
            cta: {
              text: 'Start Now',
              link: '#',
            },
          },
          {
            title: 'Step 2',
            description: 'Description for Step 2',
            icon: 'code',
            cta: {
              text: 'Continue',
              link: '#',
            },
          },
        ],
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

  it('renders the drawer and Quickstart with items', async () => {
    await renderWithApi();

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
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

    expect(screen.getByText('Step 1')).toBeInTheDocument();

    expect(drawerPaper).toHaveStyle('visibility: hidden');
  });
});
