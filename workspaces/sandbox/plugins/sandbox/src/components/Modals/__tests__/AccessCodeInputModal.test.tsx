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
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { TestApiProvider } from '@backstage/test-utils';
import { AccessCodeInputModal } from '../AccessCodeInputModal';
import { registerApiRef } from '../../../api';
import { useSandboxContext } from '../../../hooks/useSandboxContext';
import { AnsibleStatus } from '../../../utils/aap-utils';

const mockRegisterApi = {
  verifyActivationCode: jest.fn(),
};

const mockRefetchUserData = jest.fn();

const theme = createTheme();

const renderComponent = (modalOpen: boolean = true) => {
  const mockSetOpen = jest.fn();

  return {
    ...render(
      <TestApiProvider apis={[[registerApiRef, mockRegisterApi]]}>
        <ThemeProvider theme={theme}>
          <AccessCodeInputModal modalOpen={modalOpen} setOpen={mockSetOpen} />
        </ThemeProvider>
      </TestApiProvider>,
    ),
    mockSetOpen,
  };
};

jest.mock('../../../hooks/useSandboxContext');

describe('AccessCodeInputModal', () => {
  const mockUseSandboxContext = useSandboxContext as jest.MockedFunction<
    typeof useSandboxContext
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSandboxContext.mockReturnValue({
      refetchUserData: mockRefetchUserData,
      loading: false,
      userFound: false,
      userReady: false,
      ansibleStatus: AnsibleStatus.UNKNOWN,
      verificationRequired: false,
      userData: undefined,
      signupUser: jest.fn(),
      refetchAAP: jest.fn(),
      ansibleData: undefined,
      ansibleUIUser: undefined,
    } as any);
  });

  it('renders modal when open', () => {
    renderComponent(true);

    expect(screen.getByText('Enter the activation code')).toBeInTheDocument();
    expect(
      screen.getByText('If you have an activation code, enter it now.'),
    ).toBeInTheDocument();
  });

  it('does not render modal when closed', () => {
    renderComponent(false);

    expect(
      screen.queryByText('Enter the activation code'),
    ).not.toBeInTheDocument();
  });

  it('renders 5 input fields', () => {
    renderComponent();

    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(5);
  });

  it('allows uppercase letters in input fields', async () => {
    const user = userEvent.setup();
    renderComponent();

    const inputs = screen.getAllByRole('textbox');

    await user.type(inputs[0], 'A');
    expect(inputs[0]).toHaveValue('A');
  });

  it('allows lowercase letters in input fields', async () => {
    const user = userEvent.setup();
    renderComponent();

    const inputs = screen.getAllByRole('textbox');

    await user.type(inputs[0], 'a');
    expect(inputs[0]).toHaveValue('a');
  });

  it('allows numbers in input fields', async () => {
    const user = userEvent.setup();
    renderComponent();

    const inputs = screen.getAllByRole('textbox');

    await user.type(inputs[0], '1');
    expect(inputs[0]).toHaveValue('1');
  });

  it('rejects special characters', async () => {
    const user = userEvent.setup();
    renderComponent();

    const inputs = screen.getAllByRole('textbox');

    await user.type(inputs[0], '@');
    expect(inputs[0]).toHaveValue('');

    await user.type(inputs[0], '#');
    expect(inputs[0]).toHaveValue('');

    await user.type(inputs[0], ' ');
    expect(inputs[0]).toHaveValue('');
  });

  it('moves focus to next input after entering valid character', async () => {
    const user = userEvent.setup();
    renderComponent();

    const inputs = screen.getAllByRole('textbox');

    // Click on first input to focus it
    await user.click(inputs[0]);
    expect(inputs[0]).toHaveFocus();

    // Type a character
    await user.keyboard('A');

    // Check that value was set and focus moved
    expect(inputs[0]).toHaveValue('A');
    await waitFor(() => {
      expect(inputs[1]).toHaveFocus();
    });
  });

  it('moves focus to previous input on backspace when current input is empty', async () => {
    const user = userEvent.setup();
    renderComponent();

    const inputs = screen.getAllByRole('textbox');

    // Type in first input
    await user.type(inputs[0], 'A');

    // Second input should be focused, press backspace
    await user.keyboard('{Backspace}');

    // First input should now be focused
    expect(inputs[0]).toHaveFocus();
  });

  it('limits input to one character per field', async () => {
    const user = userEvent.setup();
    renderComponent();

    const inputs = screen.getAllByRole('textbox');

    await user.type(inputs[0], 'ABC');
    expect(inputs[0]).toHaveValue('A');
  });

  it('disables Start trial button when not all fields are filled', () => {
    renderComponent();

    const startTrialButton = screen.getByText('Start trial');
    expect(startTrialButton).toBeDisabled();
  });

  it('enables Start trial button when all fields are filled', async () => {
    const user = userEvent.setup();
    renderComponent();

    const inputs = screen.getAllByRole('textbox');

    // Fill all inputs by typing once in the first input - auto-focus will handle the rest
    await user.click(inputs[0]);
    await user.type(inputs[0], 'ABCDE'); // Type 5 characters to fill all 5 inputs

    // Wait for all inputs to be filled
    await waitFor(() => {
      inputs.forEach((input, index) => {
        expect(input).toHaveValue(String.fromCharCode(65 + index)); // A, B, C, D, E
      });
    });

    // Wait for the button to become enabled with longer timeout
    await waitFor(
      () => {
        const startTrialButton = screen.getByText('Start trial');
        expect(startTrialButton).not.toBeDisabled();
      },
      { timeout: 5000 },
    );
  });

  it('calls verifyActivationCode with correct code when Start trial is clicked', async () => {
    const user = userEvent.setup();
    mockRegisterApi.verifyActivationCode.mockResolvedValue(undefined);

    renderComponent();

    const inputs = screen.getAllByRole('textbox');
    const testCode = 'ABCDE';

    // Fill all inputs by typing the code in the first input - auto-focus will distribute
    await user.click(inputs[0]);
    await user.type(inputs[0], testCode);

    // Wait for all inputs to be filled
    await waitFor(() => {
      inputs.forEach((input, index) => {
        expect(input).toHaveValue(testCode[index]);
      });
    });

    // Wait for button to be enabled before clicking with longer timeout
    const startTrialButton = await waitFor(
      () => {
        const button = screen.getByText('Start trial');
        expect(button).not.toBeDisabled();
        return button;
      },
      { timeout: 5000 },
    );

    await user.click(startTrialButton);

    await waitFor(() => {
      expect(mockRegisterApi.verifyActivationCode).toHaveBeenCalledWith(
        'ABCDE',
      );
    });
  });

  it('displays error message when verification fails', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Invalid activation code';
    mockRegisterApi.verifyActivationCode.mockRejectedValue(
      new Error(errorMessage),
    );

    renderComponent();

    const inputs = screen.getAllByRole('textbox');

    // Fill all inputs by typing the code in the first input - auto-focus will distribute
    await user.click(inputs[0]);
    await user.type(inputs[0], 'AAAAA');

    // Wait for all inputs to be filled
    await waitFor(() => {
      inputs.forEach(input => {
        expect(input).toHaveValue('A');
      });
    });

    // Wait for button to be enabled before clicking with longer timeout
    const startTrialButton = await waitFor(
      () => {
        const button = screen.getByText('Start trial');
        expect(button).not.toBeDisabled();
        return button;
      },
      { timeout: 5000 },
    );

    await user.click(startTrialButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('closes modal and resets state when close button is clicked', async () => {
    const user = userEvent.setup();
    const { mockSetOpen } = renderComponent();

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], 'A');

    const closeButton = screen.getByLabelText('close');
    await user.click(closeButton);

    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });

  it('closes modal and resets state when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const { mockSetOpen } = renderComponent();

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], 'A');

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });

  it('calls refetchUserData after successful verification', async () => {
    const user = userEvent.setup();
    mockRegisterApi.verifyActivationCode.mockResolvedValue(undefined);

    renderComponent();

    const inputs = screen.getAllByRole('textbox');

    // Fill all inputs by typing the code in the first input - auto-focus will distribute
    await user.click(inputs[0]);
    await user.type(inputs[0], 'AAAAA');

    // Wait for all inputs to be filled
    await waitFor(() => {
      inputs.forEach(input => {
        expect(input).toHaveValue('A');
      });
    });

    // Wait for button to be enabled with a longer timeout
    const startTrialButton = await waitFor(
      () => {
        const button = screen.getByText('Start trial');
        expect(button).not.toBeDisabled();
        return button;
      },
      { timeout: 5000 },
    );

    await user.click(startTrialButton);

    await waitFor(() => {
      expect(mockRefetchUserData).toHaveBeenCalled();
    });
  });
});
