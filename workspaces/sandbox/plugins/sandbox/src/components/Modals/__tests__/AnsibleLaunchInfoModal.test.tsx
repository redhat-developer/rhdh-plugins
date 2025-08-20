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
import { AnsibleLaunchInfoModal } from '../AnsibleLaunchInfoModal';
import { useSandboxContext } from '../../../hooks/useSandboxContext';
import { AnsibleStatus } from '../../../utils/aap-utils';
import { wrapInTestApp } from '@backstage/test-utils';
import { Intcmp } from '../../../hooks/useProductURLs';
import * as eddlUtils from '../../../utils/eddl-utils';

// Mock the useSandboxContext hook
jest.mock('../../../hooks/useSandboxContext');

// Mock the EDDL utils
jest.mock('../../../utils/eddl-utils');

// Mock clipboard API
Object.defineProperty(window.navigator, 'clipboard', {
  value: {
    writeText: jest.fn(),
  },
});

describe('AnsibleLaunchInfoModal', () => {
  const theme = createTheme();
  const mockSetOpen = jest.fn();

  const defaultProps = {
    modalOpen: true,
    setOpen: mockSetOpen,
  };

  const mockUseSandboxContext = useSandboxContext as jest.MockedFunction<
    typeof useSandboxContext
  >;
  const mockUseTrackAnalytics = jest.spyOn(eddlUtils, 'useTrackAnalytics');

  const mockTrackAnalytics = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup window.appEventData for tests
    (global as any).window = { appEventData: [] };

    // Mock useTrackAnalytics to return our mock function
    mockUseTrackAnalytics.mockReturnValue(mockTrackAnalytics);
  });

  const renderModal = (contextOverrides = {}) => {
    mockUseSandboxContext.mockReturnValue({
      ansibleUILink: 'https://ansible.example.com',
      ansibleUIUser: 'testuser',
      ansibleUIPassword: 'password123',
      ansibleError: null,
      ansibleStatus: AnsibleStatus.READY,
      ...contextOverrides,
    } as any);

    return render(
      wrapInTestApp(
        <ThemeProvider theme={theme}>
          <AnsibleLaunchInfoModal {...defaultProps} />
        </ThemeProvider>,
      ),
    );
  };

  it('renders the ready state with correct content', () => {
    renderModal();

    // Check for header
    expect(
      screen.getByText(/Ansible Automation Platform instance provisioned/i),
    ).toBeInTheDocument();

    // Check for the introductory text with "two different accounts"
    expect(
      screen.getByText(/To get started with your AAP instance, you will need/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/two different accounts/i)).toBeInTheDocument();

    // Check for numbered sections
    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('2.')).toBeInTheDocument();

    // Check for section titles
    expect(screen.getByText('AAP admin account')).toBeInTheDocument();
    expect(screen.getByText('Red Hat account')).toBeInTheDocument();

    // Check for credentials section
    const usernameLabel = screen.getByText('Username:');
    expect(usernameLabel).toBeInTheDocument();

    const passwordLabel = screen.getByText('Password:');
    expect(passwordLabel).toBeInTheDocument();

    // Check for the new "Get started" button
    expect(
      screen.getByRole('button', {
        name: /Get started/i,
      }),
    ).toBeInTheDocument();

    // Check for logos (by alt text)
    expect(screen.getByAltText('Ansible')).toBeInTheDocument();
    expect(screen.getByAltText('Red Hat')).toBeInTheDocument();
  });

  it('renders the provisioning state with correct content', async () => {
    renderModal({ ansibleStatus: AnsibleStatus.PROVISIONING });

    // Check for provisioning title
    expect(
      screen.getByText(/Provisioning Ansible Automation Platform/i),
    ).toBeInTheDocument();

    // Check for provisioning message
    expect(
      screen.getByText(/Provisioning can take up to 30 minutes/i),
    ).toBeInTheDocument();

    // Check for modal close hint
    expect(screen.getByText(/You can close this modal/i)).toBeInTheDocument();

    // Check for the loading spinner
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Check for the info alert
    expect(screen.getByRole('alert')).toHaveTextContent(
      /You can close this modal. Follow the status of your instance on the AAP sandbox card./i,
    );
  });

  it('calls setOpen when the X button is clicked', () => {
    renderModal();

    const closeIcon = screen.getByLabelText('close');
    fireEvent.click(closeIcon);

    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });

  it('toggles password visibility when visibility button is clicked', () => {
    renderModal();

    // Find all password input fields
    const inputs = document.querySelectorAll('input[type="password"]');
    expect(inputs.length).toBeGreaterThan(0); // Ensure we have at least one password field

    const passwordField = inputs[0] as HTMLInputElement;

    // Find the visibility toggle button - should have Visibility or VisibilityOff icon
    const visibilityButtons = screen
      .getAllByRole('button')
      .filter(button => button.innerHTML.includes('Visibility'));

    expect(visibilityButtons.length).toBeGreaterThan(0);
    const toggleButton = visibilityButtons[0];

    // Initial state (should be password)
    expect(passwordField.type).toBe('password');

    // Click to show
    fireEvent.click(toggleButton);
    expect(passwordField.type).toBe('text');

    // Click to hide
    fireEvent.click(toggleButton);
    expect(passwordField.type).toBe('password');
  });

  it('copies username to clipboard when copy button is clicked', () => {
    renderModal();

    // Get all the copy buttons in the document by looking for ContentCopy icon
    const copyButtons = screen
      .getAllByRole('button')
      .filter(button => button.innerHTML.includes('ContentCopy'));

    // First copy button should be for username
    fireEvent.click(copyButtons[0]);
    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(
      'testuser',
    );
  });

  it('copies password to clipboard when copy button is clicked', () => {
    renderModal();

    // Get all the copy buttons in the document by looking for ContentCopy icon
    const copyButtons = screen
      .getAllByRole('button')
      .filter(button => button.innerHTML.includes('ContentCopy'));

    // Second copy button should be for password
    fireEvent.click(copyButtons[1]);
    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(
      'password123',
    );
  });

  it('shows error message when ansibleError is provided', () => {
    const errorMessage = 'Failed to provision AAP instance';
    renderModal({
      ansibleStatus: AnsibleStatus.READY,
      ansibleError: errorMessage,
      ansibleUIUser: undefined,
      ansibleUIPassword: '',
      ansibleUILink: undefined,
    });

    // Look for error icon and message
    const errorIcon = document.querySelector('[data-testid="ErrorIcon"]');
    expect(errorIcon).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('contains section descriptions for both accounts', () => {
    renderModal();

    // Check for AAP admin account description
    expect(
      screen.getByText(/Log in to your AAP admin account within the new tab/i),
    ).toBeInTheDocument();

    // Check for Red Hat account description
    expect(
      screen.getByText(
        /Once logged in, you'll need to activate your subscription/i,
      ),
    ).toBeInTheDocument();
  });

  it('has the correct link target for the Get started button', () => {
    renderModal();

    const getStartedButton = screen.getByRole('button', {
      name: /Get started/i,
    });

    // The button should be wrapped in a Link component that targets the ansible URL
    const linkElement = getStartedButton.closest('a');
    expect(linkElement).toHaveAttribute('href', `https://ansible.example.com`);
    expect(linkElement).toHaveAttribute('target', '_blank');
  });

  it('displays the launch button instruction text', () => {
    renderModal();

    expect(
      screen.getByText(/Access this information again by clicking the/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Launch/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /button on the Ansible Automation Platform sandbox card/i,
      ),
    ).toBeInTheDocument();
  });

  describe('CTA Event Pushing', () => {
    it('should disable automatic tracking and push CTA event when Get started link is clicked', () => {
      renderModal();

      const getStartedButton = screen.getByRole('button', {
        name: /Get started/i,
      });

      // The button should be wrapped in a Link component
      const linkElement = getStartedButton.closest('a');

      // Should have automatic tracking disabled
      expect(linkElement).toHaveAttribute(
        'data-analytics-track-by-analytics-manager',
        'false',
      );

      // Click the link
      fireEvent.click(linkElement!);

      // Should push CTA event with correct parameters
      expect(mockTrackAnalytics).toHaveBeenCalledWith(
        'Get Started - Ansible',
        'Catalog',
        'https://ansible.example.com',
        Intcmp.AAP,
        'cta',
      );
    });

    it('should not push CTA event if ansibleUILink is not available', () => {
      // Clear all mocks to ensure clean state
      jest.clearAllMocks();

      const contextOverrides = {
        ansibleStatus: AnsibleStatus.READY,
        ansibleUILink: undefined, // No link available
        ansibleUIUser: 'admin',
        ansibleUIPassword: 'password123',
        ansibleError: null,
      };

      renderModal(contextOverrides);

      const getStartedButton = screen.getByRole('button', {
        name: /Get started/i,
      });

      const linkElement = getStartedButton.closest('a');
      fireEvent.click(linkElement!);

      // Should not push event when link is not available
      expect(mockTrackAnalytics).not.toHaveBeenCalled();
    });
  });
});
