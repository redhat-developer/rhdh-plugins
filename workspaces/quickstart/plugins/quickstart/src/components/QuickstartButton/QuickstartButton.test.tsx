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
import { QuickstartButton } from './QuickstartButton';
import { useQuickstartDrawerContext } from '../../hooks/useQuickstartDrawerContext';

// Mock the hooks
jest.mock('../../hooks/useQuickstartDrawerContext', () => ({
  useQuickstartDrawerContext: jest.fn(),
}));

describe('QuickstartButton', () => {
  const mockToggleDrawer = jest.fn();
  const mockOnClick = jest.fn();

  const mockConfigApi = mockApis.config({
    data: {
      app: {
        quickstart: [
          {
            title: 'Test Quickstart',
            roles: ['admin'],
            steps: [],
          },
        ],
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useQuickstartDrawerContext as jest.Mock).mockReturnValue({
      toggleDrawer: mockToggleDrawer,
      userRole: 'admin',
      roleLoading: false,
    });
  });

  const renderWithApi = (configApi = mockConfigApi) => {
    return renderInTestApp(
      <TestApiProvider apis={[[configApiRef, configApi]]}>
        <QuickstartButton />
      </TestApiProvider>,
    );
  };

  it('renders the button when user has quickstart items', async () => {
    await renderWithApi();

    const button = screen.getByTestId('quickstart-button');
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Quick start')).toBeInTheDocument();
  });

  it('does not render when user has no quickstart items', async () => {
    const emptyConfigApi = mockApis.config({
      data: {
        app: {
          quickstart: [],
        },
      },
    });

    await renderWithApi(emptyConfigApi);

    const button = screen.queryByTestId('quickstart-button');
    expect(button).not.toBeInTheDocument();
  });

  it('does not render when user role does not match any items', async () => {
    (useQuickstartDrawerContext as jest.Mock).mockReturnValue({
      toggleDrawer: mockToggleDrawer,
      userRole: 'developer', // No items for developer in our mock config
      roleLoading: false,
    });

    await renderWithApi();

    const button = screen.queryByTestId('quickstart-button');
    expect(button).not.toBeInTheDocument();
  });

  it('calls toggleDrawer when clicked', async () => {
    await renderWithApi();

    const button = screen.getByTestId('quickstart-button');
    fireEvent.click(button);

    expect(mockToggleDrawer).toHaveBeenCalledTimes(1);
  });

  it('calls custom onClick when provided', async () => {
    const { rerender } = await renderWithApi();

    rerender(
      <TestApiProvider apis={[[configApiRef, mockConfigApi]]}>
        <QuickstartButton onClick={mockOnClick} />
      </TestApiProvider>,
    );

    const button = screen.getByTestId('quickstart-button');
    fireEvent.click(button);

    expect(mockToggleDrawer).toHaveBeenCalledTimes(1);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('renders with custom title', async () => {
    const { rerender } = await renderWithApi();

    rerender(
      <TestApiProvider apis={[[configApiRef, mockConfigApi]]}>
        <QuickstartButton title="Custom Quickstart" />
      </TestApiProvider>,
    );

    expect(screen.getByText('Custom Quickstart')).toBeInTheDocument();
  });

  it('applies custom styles', async () => {
    const customStyle = { backgroundColor: 'red' };
    const { rerender } = await renderWithApi();

    rerender(
      <TestApiProvider apis={[[configApiRef, mockConfigApi]]}>
        <QuickstartButton style={customStyle} />
      </TestApiProvider>,
    );

    const button = screen.getByTestId('quickstart-button');
    expect(button).toHaveStyle('background-color: red');
  });
});
