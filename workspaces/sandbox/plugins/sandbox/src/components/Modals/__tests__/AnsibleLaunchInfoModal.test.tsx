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

// Mock the useSandboxContext hook
jest.mock('../../../hooks/useSandboxContext');

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

  beforeEach(() => {
    jest.clearAllMocks();
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

    // Check for header - use a more flexible matcher due to potential whitespace issues
    expect(
      screen.getByText(/Ansible Automation Platform instance provisioned/i),
    ).toBeInTheDocument();

    // Check for credentials section
    expect(
      screen.getByText(/Log in to your AAP trial account/i),
    ).toBeInTheDocument();

    // The username value is in a TextField, which might not be directly accessible via getByText
    const usernameLabel = screen.getByText('Username:');
    expect(usernameLabel).toBeInTheDocument();

    const passwordLabel = screen.getByText('Password:');
    expect(passwordLabel).toBeInTheDocument();

    // Check for login button
    expect(
      screen.getByRole('button', {
        name: /Log in to Ansible Automation Platform/i,
      }),
    ).toBeInTheDocument();

    // Find the close button using exact text match
    const closeButtons = screen.getAllByRole('button', { name: /Close/i });
    expect(closeButtons.length).toBeGreaterThan(0);
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

  it('calls setOpen when close button is clicked', () => {
    renderModal();

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(mockSetOpen).toHaveBeenCalledWith(false);
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
});
