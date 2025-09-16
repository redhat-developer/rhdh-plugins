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
import * as eddlUtils from '../../../utils/eddl-utils';
import { wrapInTestApp } from '@backstage/test-utils';

// Mock the useSandboxContext hook
jest.mock('../../../hooks/useSandboxContext');

// Mock the EDDL utils
jest.mock('../../../utils/eddl-utils');

describe('SandboxCatalogCardButton', () => {
  const theme = createTheme();
  const mockHandleTryButtonClick = jest.fn();

  const defaultProps = {
    link: 'https://example.com',
    id: Product.OPENSHIFT_CONSOLE,
    title: 'OpenShift',
    handleTryButtonClick: mockHandleTryButtonClick,
    theme: theme,
  };

  const mockUseSandboxContext = useSandboxContext as jest.MockedFunction<
    typeof useSandboxContext
  >;
  const mockTrackAnalytics = jest.fn();
  const mockUseTrackAnalytics = jest.spyOn(eddlUtils, 'useTrackAnalytics');

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup window.appEventData for tests
    (global as any).window = { appEventData: [] };

    // Mock useTrackAnalytics to return our mock function
    mockUseTrackAnalytics.mockReturnValue(mockTrackAnalytics);
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

  describe('CTA Event Pushing', () => {
    it('should disable automatic tracking and push CTA event when button is clicked (user not found)', () => {
      // User not found - button should have tracking disabled and push event on click
      mockUseSandboxContext.mockReturnValue({
        loading: false,
        userFound: false,
        userReady: false,
        ansibleStatus: AnsibleStatus.UNKNOWN,
      } as any);

      renderButton();

      const button = screen.getByRole('button');

      // Should have automatic tracking disabled
      expect(button).toHaveAttribute(
        'data-analytics-track-by-analytics-manager',
        'false',
      );

      // Click the button
      fireEvent.click(button);

      // Should push CTA event
      expect(mockTrackAnalytics).toHaveBeenCalledWith(
        'OpenShift',
        'Catalog',
        'https://example.com',
        '701Pe00000dnCEYIA2',
        'cta',
      );
    });

    it('should disable automatic tracking and push CTA event when link is clicked (user found)', () => {
      // User found and ready - link should have tracking disabled and push event on click
      mockUseSandboxContext.mockReturnValue({
        loading: false,
        userFound: true,
        userReady: true,
        verificationRequired: false,
        ansibleStatus: AnsibleStatus.UNKNOWN,
      } as any);

      renderButton();

      const link = screen.getByRole('link');

      // Should have automatic tracking disabled
      expect(link).toHaveAttribute(
        'data-analytics-track-by-analytics-manager',
        'false',
      );

      // Click the link
      fireEvent.click(link);

      // Should push CTA event
      expect(mockTrackAnalytics).toHaveBeenCalledWith(
        'OpenShift',
        'Catalog',
        'https://example.com',
        '701Pe00000dnCEYIA2',
        'cta',
      );
    });

    it('should push CTA event with correct product details for different products', () => {
      const testCases = [
        {
          id: Product.OPENSHIFT_CONSOLE,
          title: 'OpenShift',
          expectedIntcmp: '701Pe00000dnCEYIA2',
        },
        {
          id: Product.OPENSHIFT_AI,
          title: 'OpenShift AI',
          expectedIntcmp: '701Pe00000do2uiIAA',
        },
        {
          id: Product.DEVSPACES,
          title: 'Dev Spaces',
          expectedIntcmp: '701Pe00000doTQCIA2',
        },
        {
          id: Product.AAP,
          title: 'Ansible Automation Platform',
          expectedIntcmp: '701Pe00000dowQXIAY',
        },
        {
          id: Product.OPENSHIFT_VIRT,
          title: 'OpenShift Virtualization',
          expectedIntcmp: '701Pe00000dov6IIAQ',
        },
      ];

      testCases.forEach(({ id, title, expectedIntcmp }) => {
        // Reset mocks for each test case
        jest.clearAllMocks();

        mockUseSandboxContext.mockReturnValue({
          loading: false,
          userFound: false,
          userReady: false,
          ansibleStatus: AnsibleStatus.UNKNOWN,
        } as any);

        const { unmount } = renderButton({ id, title });

        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(mockTrackAnalytics).toHaveBeenCalledWith(
          title,
          'Catalog',
          'https://example.com',
          expectedIntcmp,
          'cta',
        );

        unmount();
      });
    });
  });
});
