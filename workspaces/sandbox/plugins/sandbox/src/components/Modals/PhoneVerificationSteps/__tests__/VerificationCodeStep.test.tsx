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

// Mock the props interface if it's not exported from the component file
declare module '../VerificationCodeStep' {
  interface VerificationCodeProps {
    otp: string[];
    setOtp: React.Dispatch<React.SetStateAction<string[]>>;
    handleResendCode: () => void;
    codeResent: boolean;
    phoneNumber: E164Number | undefined;
    handleEditPhoneNumber: () => void;
    handleStartTrialClick: () => void;
    handleClose: () => void;
    loading?: boolean;
    error?: string;
  }
}

describe('VerificationCodeStep', () => {
  const mockSetOpt = jest.fn();
  const mockHandleResendCode = jest.fn();
  const mockHandleClose = jest.fn();
  const mockHandleEditPhoneNumber = jest.fn();
  const mockHandleStartTrialClick = jest.fn();
  const otpCode: string[] = ['1', '2', '3', '4', '5'];
  const phoneNumber = parsePhoneNumber('8 (800) 555-35-35', 'RU');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderComponent(error?: string) {
    render(
      <VerificationCodeStep
        otp={otpCode}
        setOtp={mockSetOpt}
        handleResendCode={mockHandleResendCode}
        codeResent={false}
        phoneNumber={phoneNumber.number}
        handleEditPhoneNumber={mockHandleEditPhoneNumber}
        handleStartTrialClick={mockHandleStartTrialClick}
        handleClose={mockHandleClose}
        loading={false}
        error={error}
      />,
    );
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

  test('should submit otp code when clicking start trial', () => {
    renderComponent();
    const submitButton = screen.getByRole('button', { name: /Start trial/i });
    fireEvent.click(submitButton);
    expect(mockHandleStartTrialClick).toHaveBeenCalled();
  });

  test('should show an error when otp is invalid', () => {
    renderComponent('invalid otp code');
    const submitButton = screen.getByRole('button', { name: /Start trial/i });
    fireEvent.click(submitButton);
    expect(mockHandleStartTrialClick).toHaveBeenCalled();
    // expect error from backend to be displayed
    expect(screen.getByText('invalid otp code')).toBeInTheDocument();
    // submit button should be enabled so user can retry with new code
    expect(screen.getByText(/Start trial/i).closest('button')).toBeEnabled();
  });

  test('closes the modal when the close button is clicked', () => {
    renderComponent();
    const closeButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(closeButton);
    expect(mockHandleClose).toHaveBeenCalled();
  });
});
