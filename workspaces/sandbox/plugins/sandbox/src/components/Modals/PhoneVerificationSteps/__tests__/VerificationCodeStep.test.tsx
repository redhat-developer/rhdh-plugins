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
import { fireEvent, render, screen } from '@testing-library/react';
import { E164Number } from 'libphonenumber-js/types';
import { parsePhoneNumber } from 'libphonenumber-js/min';
import VerificationCodeStep from '../VerificationCodeStep';
import { Product } from '../../../SandboxCatalog/productData';
import { Country } from 'react-phone-number-input';
import { useSandboxContext } from '../../../../hooks/useSandboxContext';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn().mockReturnValue({
    completePhoneVerification: jest.fn(),
  }),
}));

jest.useFakeTimers(); // control timers
// mock hooks
jest.mock('../../../../hooks/useSandboxContext');

// Mock the props interface if it's not exported from the component file
declare module '../VerificationCodeStep' {
  interface VerificationCodeProps {
    id: Product;
    otp: string[];
    setOtp: React.Dispatch<React.SetStateAction<string[]>>;
    country: Country;
    phoneNumber: E164Number | undefined;
    handleEditPhoneNumber: () => void;
    handleClose: () => void;
    setAnsibleCredsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    loading?: boolean;
  }
}

describe('VerificationCodeStep', () => {
  const mockSetOpt = jest.fn();
  const mockHandleClose = jest.fn();
  const mockHandleEditPhoneNumber = jest.fn();
  const mockSetLoading = jest.fn();
  const mockSetAnsibleCredsModalOpen = jest.fn();
  const mockRefetchUserData = jest.fn();
  const mockSetRefetchingUserData = jest.fn();
  const mockHandleAAPInstance = jest.fn();
  const mockRefetchAAP = jest.fn();
  const mockUseSandboxContext = useSandboxContext as jest.MockedFunction<
    typeof useSandboxContext
  >;
  const mockOpen = jest.fn();
  const otpCode: string[] = ['1', '2', '3', '4', '5'];
  const phoneNumber = parsePhoneNumber('8 (800) 555-35-35', 'RU');
  const mockCountry: Country = 'RU';

  beforeEach(() => {
    jest.clearAllMocks();
    // refetching the user data will return the actual user provisioned
    mockRefetchUserData.mockReturnValue({
      name: 'bob',
      consoleURL: 'https://sandboxcluster.test/',
      cheDashboardURL: 'https://devspaces.test/',
      proxyURL: 'https://api-sandboxcluster.test',
      rhodsMemberURL: 'https://rhods-dashboard.test/',
      apiEndpoint: 'https://api.test:6443',
      clusterName: 'sandboxcluster.test',
      defaultUserNamespace: 'bob-2-dev',
      compliantUsername: 'bob-2',
      username: 'bob',
      status: {
        ready: true,
        reason: 'Provisioned',
        verificationRequired: false,
      },
    } as any);

    mockUseSandboxContext.mockReturnValue({
      refetchUserData: mockRefetchUserData,
      refetchAAP: mockRefetchAAP,
      handleAAPInstance: mockHandleAAPInstance,
    } as any);
  });

  const defaultProps = {
    id: Product.OPENSHIFT_CONSOLE,
    otp: otpCode,
    setOtp: mockSetOpt,
    phoneNumber: phoneNumber.number,
    handleEditPhoneNumber: mockHandleEditPhoneNumber,
    handleClose: mockHandleClose,
    setLoading: mockSetLoading,
    setAnsibleCredsModalOpen: mockSetAnsibleCredsModalOpen,
    setRefetchingUserData: mockSetRefetchingUserData,
    loading: false,
    country: mockCountry,
  };

  function renderComponent(props = {}) {
    render(<VerificationCodeStep {...defaultProps} {...props} />);
  }

  test('should render modal', () => {
    renderComponent();
    // expected text should be there
    expect(screen.getByText('Enter the verification code')).toBeInTheDocument();
    const sentMessageDialog = screen.getAllByTestId('sent-message-dialog');
    expect(sentMessageDialog[0]).toHaveTextContent(
      "We've sent a verification code to +7 8005553535.",
    );
    // submit phone button should be there
    const submitButton = screen.getAllByTestId('submit-opt-button');
    expect(submitButton).toHaveLength(1);
    // opt inputs are there
    const optInputFields = screen.getAllByTestId('opt-inputs');
    expect(optInputFields).toHaveLength(5);
    // resend opt should be there
    const resendOptLink = screen.getAllByTestId('resend-code-link');
    expect(resendOptLink).toHaveLength(1);
    // close button should be there
    const closeButton = screen.getAllByTestId('close-opt-button');
    expect(closeButton).toHaveLength(2);
  });

  test('should submit opt code when clicking start trial and open selected url', async () => {
    window.open = mockOpen; // override window.open with mock
    renderComponent();
    const submitButton = screen.getByRole('button', { name: /Start trial/i });
    fireEvent.click(submitButton);

    // advance timers to trigger all retries
    for (let i = 0; i < 5; i++) {
      jest.advanceTimersByTime(1000);
      await Promise.resolve(); // allow awaiting the timer to flush
    }

    expect(mockRefetchUserData).toHaveBeenCalled();
    expect(mockOpen).toHaveBeenCalledWith(
      'https://sandboxcluster.test/',
      '_blank',
    ); // check it opens the url after signup
  });

  test('should submit opt code when clicking start trial and provision AAP', async () => {
    window.open = mockOpen; // override window.open with mock
    renderComponent({ id: Product.AAP });
    const submitButton = screen.getByRole('button', { name: /Start trial/i });
    fireEvent.click(submitButton);

    // advance timers to trigger all retries
    for (let i = 0; i < 5; i++) {
      jest.advanceTimersByTime(1000);
      await Promise.resolve(); // allow awaiting the timer to flush
    }

    expect(mockRefetchUserData).toHaveBeenCalled();
    expect(mockHandleAAPInstance).toHaveBeenCalledWith('bob-2-dev'); // check it calls the aap specific functionality
    expect(mockHandleClose).toHaveBeenCalled(); // it closes the modal after
  });

  test('closes the modal when the close button is clicked', () => {
    renderComponent();
    const closeButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(closeButton);
    expect(mockHandleClose).toHaveBeenCalled();
  });
});
