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
import { PhoneVerificationModal } from '../PhoneVerificationModal';
import { registerApiRef } from '../../../api';
import { useSandboxContext } from '../../../hooks/useSandboxContext'; // Corrected path
import { TestApiProvider } from '@backstage/test-utils';
import { AnsibleStatus } from '../../../utils/aap-utils';

// Mock dependencies
jest.mock('../../../hooks/useSandboxContext');
jest.mock('../../../utils/common', () => ({
  errorMessage: jest.fn(e => e.message || 'Unknown error'),
}));

// Mock the props interface if it's not exported from the component file
declare module '../PhoneVerificationModal' {
  interface PhoneVerificationModalProps {
    modalOpen: boolean;
    setOpen: (open: boolean) => void;
  }
}

describe('PhoneVerificationModal', () => {
  const mockInitiatePhoneVerification = jest.fn();
  const mockCompletePhoneVerification = jest.fn();
  const mockRefetchUserData = jest.fn();
  const mockSetOpen = jest.fn();

  const mockRegisterApi = {
    initiatePhoneVerification: mockInitiatePhoneVerification,
    completePhoneVerification: mockCompletePhoneVerification,
    // Add other required methods from the API
    getRecaptchaAPIKey: jest.fn(),
    getSignUpData: jest.fn(),
    signup: jest.fn(),
    verifyActivationCode: jest.fn(),
  };

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

  const renderComponent = (props = {}) => {
    return render(
      <TestApiProvider apis={[[registerApiRef, mockRegisterApi]]}>
        <PhoneVerificationModal modalOpen setOpen={mockSetOpen} {...props} />
      </TestApiProvider>,
    );
  };

  test('should open the modal', () => {
    renderComponent();

    expect(screen.getByText("Let's verify you")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Enter your phone number and we'll send you a text message with a verification code.",
      ),
    ).toBeInTheDocument();
  });

  test('should handle modal close', () => {
    renderComponent();

    // Find and click close button/icon
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });
});
