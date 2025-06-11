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
import { SandboxCatalogCardButton } from '../SandboxCatalogCardButton';
import { useSandboxContext } from '../../../hooks/useSandboxContext';
import { AnsibleStatus } from '../../../utils/aap-utils';
import { Product } from '../productData';
import { wrapInTestApp } from '@backstage/test-utils';

// Mock the useSandboxContext hook
jest.mock('../../../hooks/useSandboxContext');

describe('SandboxCatalogCardButton', () => {
  const theme = createTheme();
  const mockHandleTryButtonClick = jest.fn();

  const defaultProps = {
    link: 'https://example.com',
    id: Product.OPENSHIFT_CONSOLE,
    handleTryButtonClick: mockHandleTryButtonClick,
    theme: theme,
  };

  const mockUseSandboxContext = useSandboxContext as jest.MockedFunction<
    typeof useSandboxContext
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSandboxContext.mockReturnValue({
      loading: false,
      userFound: false,
      userReady: false,
      ansibleStatus: AnsibleStatus.UNKNOWN,
    } as any);
  });

  const renderButton = (props = {}) => {
    return render(
      wrapInTestApp(
        <ThemeProvider theme={theme}>
          <SandboxCatalogCardButton {...defaultProps} {...props} />
        </ThemeProvider>,
      ),
    );
  };

  it('renders with "Try it" label for non-AAP products', () => {
    renderButton();
    expect(screen.getByText('Try it')).toBeInTheDocument();
  });

  it('renders with "Provision" label for AAP product with UNKNOWN status', () => {
    renderButton({ id: Product.AAP });
    expect(screen.getByText('Provision')).toBeInTheDocument();
  });

  it('renders with "Provisioning" label for AAP product with PROVISIONING status', () => {
    mockUseSandboxContext.mockReturnValue({
      loading: false,
      userFound: false,
      userReady: false,
      ansibleStatus: AnsibleStatus.PROVISIONING,
    } as any);

    renderButton({ id: Product.AAP });
    expect(screen.getByText('Provisioning')).toBeInTheDocument();
  });

  it('renders with "Launch" label for AAP product with READY status', () => {
    mockUseSandboxContext.mockReturnValue({
      loading: false,
      userFound: false,
      userReady: false,
      ansibleStatus: AnsibleStatus.READY,
    } as any);

    renderButton({ id: Product.AAP });
    expect(screen.getByText('Launch')).toBeInTheDocument();
  });

  it('renders with "Reprovision" label for AAP product with IDLED status', () => {
    mockUseSandboxContext.mockReturnValue({
      loading: false,
      userFound: false,
      userReady: false,
      ansibleStatus: AnsibleStatus.IDLED,
    } as any);

    renderButton({ id: Product.AAP });
    expect(screen.getByText('Reprovision')).toBeInTheDocument();
  });

  it('button was clicked - shows loading spinner when userFound is true but userReady is false', async () => {
    mockUseSandboxContext.mockReturnValue({
      loading: false,
      userFound: true,
      userReady: false,
      ansibleStatus: AnsibleStatus.UNKNOWN,
      verificationRequired: false,
    } as any);

    renderButton();
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows loading spinner for AAP product with UNKNOWN status', () => {
    mockUseSandboxContext.mockReturnValue({
      loading: false,
      userFound: false,
      userReady: false,
      ansibleStatus: AnsibleStatus.UNKNOWN,
    } as any);

    renderButton({ id: Product.AAP });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows loading spinner for AAP product with PROVISIONING status', () => {
    mockUseSandboxContext.mockReturnValue({
      loading: false,
      userFound: false,
      userReady: false,
      ansibleStatus: AnsibleStatus.PROVISIONING,
    } as any);

    renderButton({ id: Product.AAP });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows external link icon for non-AAP products', () => {
    renderButton();
    // OpenInNewIcon doesn't have a testId, so we're checking for the SVG
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('calls handleTryButtonClick when button is clicked', () => {
    renderButton();

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockHandleTryButtonClick).toHaveBeenCalledWith(
      Product.OPENSHIFT_CONSOLE,
    );
  });

  it('does not call handleTryButtonClick when button is clicked but loading is true', () => {
    mockUseSandboxContext.mockReturnValue({
      loading: true,
      userFound: false,
      userReady: false,
      ansibleStatus: AnsibleStatus.UNKNOWN,
    } as any);

    renderButton();

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockHandleTryButtonClick).not.toHaveBeenCalled();
  });

  it('renders a Link component when userFound is true and not loading', () => {
    mockUseSandboxContext.mockReturnValue({
      loading: false,
      userFound: true,
      userReady: true,
      ansibleStatus: AnsibleStatus.UNKNOWN,
    } as any);

    renderButton();

    // In the wrapInTestApp context, Link component renders an anchor
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('does not render a Link component when userFound is false', () => {
    mockUseSandboxContext.mockReturnValue({
      loading: false,
      userFound: false,
      userReady: false,
      ansibleStatus: AnsibleStatus.UNKNOWN,
    } as any);

    renderButton();

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
