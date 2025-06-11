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
import { useSandboxContext } from '../../../hooks/useSandboxContext';
import { AnsibleStatus } from '../../../utils/aap-utils';
import { Product } from '../productData';
import { wrapInTestApp } from '@backstage/test-utils';
import { SandboxCatalogCardDeleteButton } from '../SandboxCatalogCardDeleteButton';

// Mock the useSandboxContext hook
jest.mock('../../../hooks/useSandboxContext');

describe('SandboxCatalogCardDeleteButton', () => {
  const theme = createTheme();
  const mockHandleDeleteButtonClick = jest.fn();

  const defaultProps = {
    id: Product.AAP,
    handleDeleteButtonClick: mockHandleDeleteButtonClick,
    theme: theme,
    isDeleting: false,
  };

  const mockUseSandboxContext = useSandboxContext as jest.MockedFunction<
    typeof useSandboxContext
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSandboxContext.mockReturnValue({
      ansibleStatus: AnsibleStatus.UNKNOWN,
    } as any);
  });

  const renderButton = (props = {}) => {
    return render(
      wrapInTestApp(
        <ThemeProvider theme={theme}>
          <SandboxCatalogCardDeleteButton {...defaultProps} {...props} />
        </ThemeProvider>,
      ),
    );
  };

  it('renders only for AAP card', () => {
    renderButton({ id: Product.OPENSHIFT_CONSOLE });
    const deleteButton = document.querySelector('[data-testid="delete-aap"]');
    expect(deleteButton).toBeNull();
  });

  it('shows Stop when AAP is provisioning', () => {
    renderButton();
    const tryItButton = screen.getByRole('button', { name: /Stop/i });
    expect(tryItButton).toBeInTheDocument();
  });

  it('shows Delete when AAP is ready', () => {
    mockUseSandboxContext.mockReturnValue({
      ansibleStatus: AnsibleStatus.READY,
    } as any);
    renderButton();
    const tryItButton = screen.getByRole('button', { name: /Delete/i });
    expect(tryItButton).toBeInTheDocument();
  });

  it('calls HandleDeleteButtonClick when clicked', () => {
    renderButton();
    const tryItButton = screen.getByRole('button', { name: /Stop/i });
    expect(tryItButton).toBeInTheDocument();
    fireEvent.click(tryItButton);
    expect(mockHandleDeleteButtonClick).toHaveBeenCalled();
  });
});
