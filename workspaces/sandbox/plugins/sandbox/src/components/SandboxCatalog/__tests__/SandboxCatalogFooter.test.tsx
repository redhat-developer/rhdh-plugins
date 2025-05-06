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

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { wrapInTestApp } from '@backstage/test-utils';
import { SandboxCatalogFooter } from '../SandboxCatalogFooter';
import { useSandboxContext } from '../../../hooks/useSandboxContext';

// Mock the useSandboxContext hook
jest.mock('../../../hooks/useSandboxContext');

// Mock AccessCodeInputModal
jest.mock('../../Modals/AccessCodeInputModal', () => ({
  AccessCodeInputModal: jest.fn(({ modalOpen }) =>
    modalOpen ? <div data-testid="mock-modal">Modal Content</div> : null,
  ),
}));

describe('SandboxCatalogFooter', () => {
  const theme = createTheme();
  const mockUseSandboxContext = useSandboxContext as jest.MockedFunction<
    typeof useSandboxContext
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderFooter = (userData?: any) => {
    mockUseSandboxContext.mockReturnValue({
      userData,
    } as any);

    return render(
      wrapInTestApp(
        <ThemeProvider theme={theme}>
          <SandboxCatalogFooter />
        </ThemeProvider>,
      ),
    );
  };

  it('renders footer when userData is undefined', () => {
    renderFooter(undefined);

    expect(screen.getByText('Have an activation code?')).toBeInTheDocument();
    expect(screen.getByText('Click here')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
  });

  it('does not render footer when userData is defined', () => {
    renderFooter({ name: 'Test User' });

    expect(
      screen.queryByText('Have an activation code?'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Click here')).not.toBeInTheDocument();
  });

  it('opens modal when the link is clicked', () => {
    renderFooter(undefined);

    const link = screen.getByText('Click here');
    fireEvent.click(link);

    expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
  });

  it('renders footer with correct styling', () => {
    renderFooter(undefined);

    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveStyle('padding: 16px'); // theme.spacing(2) is typically 16px

    // In light mode, should have white background
    expect(footer).toHaveStyle('background-color: #fff');
  });

  it('renders text with center alignment', () => {
    renderFooter(undefined);

    const typography = screen
      .getByText('Have an activation code?')
      .closest('p');
    expect(typography).toHaveStyle('text-align: center');
  });
});
