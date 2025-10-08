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
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PhoneNumberStep } from '../PhoneNumberStep';
import { E164Number } from 'libphonenumber-js/types';
import { Country } from 'react-phone-number-input';
import { parsePhoneNumber } from 'libphonenumber-js/min';
import { PhoneNumber } from 'libphonenumber-js';
import * as eddlUtils from '../../../../utils/eddl-utils';

// Mock the useTrackAnalytics hook
jest.mock('../../../../utils/eddl-utils', () => ({
  ...jest.requireActual('../../../../utils/eddl-utils'),
  useTrackAnalytics: jest.fn(),
}));

// Mock the props interface if it's not exported from the component file
declare module '../PhoneNumberStep' {
  interface PhoneNumberFormProps {
    phoneNumber: E164Number | undefined;
    setPhoneNumber: React.Dispatch<
      React.SetStateAction<E164Number | undefined>
    >;
    setCountry: React.Dispatch<React.SetStateAction<Country | undefined>>;
    country: Country | undefined;
    handleClose: () => void;
    handlePhoneNumberSubmit: () => void;
    loading?: boolean;
    error?: string;
  }
}

describe('PhoneNumberStep', () => {
  const mockTrackAnalytics = jest.fn();
  const mockSetPhoneNumber = jest.fn();
  const mockHandleClose = jest.fn();
  const mockHandlePhoneNumberSubmit = jest.fn();
  const mockSetCountry = jest.fn();
  const phoneNumber = parsePhoneNumber(' 8 (800) 555-35-35 ', 'RU');

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the useTrackAnalytics hook to return a mock function
    mockTrackAnalytics.mockResolvedValue(undefined); // Make it async
    (eddlUtils.useTrackAnalytics as jest.Mock).mockReturnValue(
      mockTrackAnalytics,
    );
  });

  function renderComponent(inputPhoneNumber: PhoneNumber, error?: string) {
    render(
      <PhoneNumberStep
        phoneNumber={inputPhoneNumber.number}
        setPhoneNumber={mockSetPhoneNumber}
        handleClose={mockHandleClose}
        handlePhoneNumberSubmit={mockHandlePhoneNumberSubmit}
        setCountry={mockSetCountry}
        country="RU"
        error={error}
      />,
    );
  }

  test('should render modal', () => {
    renderComponent(phoneNumber);
    // expected text should be there
    expect(screen.getByText("Let's verify you")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Enter your phone number and we'll send you a text message with a verification code.",
      ),
    ).toBeInTheDocument();
    // country code selection should be there
    const phoneInputs = screen.getAllByTestId('tel-input');
    expect(phoneInputs).toHaveLength(1);
    // phone number input should be there
    const countryInputs = screen.getAllByTestId('country-code-select');
    expect(countryInputs).toHaveLength(1);
    // submit phone button should be there
    const submitButton = screen.getAllByTestId('submit-phone-button');
    expect(submitButton).toHaveLength(1);
    // close button should be there
    const closeButton = screen.getAllByTestId('close-phone-button');
    expect(closeButton).toHaveLength(1);
  });

  test('should submit phone number when clicking send code button', async () => {
    renderComponent(phoneNumber);
    // Find and click send code button
    const submitPhoneNumberButton = screen.getByRole('button', {
      name: /Send code/i,
    });
    fireEvent.click(submitPhoneNumberButton);

    // Wait for the async tracking call to complete
    await waitFor(() => {
      expect(mockHandlePhoneNumberSubmit).toHaveBeenCalled();
    });
  });

  test('should show an error when phone number is invalid', async () => {
    const invalidPhoneNumber = parsePhoneNumber(' 8 (800) xxxx ', 'RU');
    renderComponent(invalidPhoneNumber, 'invalid phone number error');
    // Find and click send code
    const submitPhoneNumberButton = screen.getByRole('button', {
      name: /Send code/i,
    });
    fireEvent.click(submitPhoneNumberButton);

    // Wait for the async tracking call to complete
    await waitFor(() => {
      expect(mockHandlePhoneNumberSubmit).toHaveBeenCalled();
    });

    // expect mock error from backend to be displayed
    expect(screen.getByText('invalid phone number error')).toBeInTheDocument();
    // submit button should be enabled so user can retry with new number
    expect(screen.getByText(/Send code/i).closest('button')).toBeEnabled();
  });

  test('closes the modal when the close button is clicked', async () => {
    renderComponent(phoneNumber);
    const closeButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(closeButton);

    // Wait for the async tracking call to complete
    await waitFor(() => {
      expect(mockHandleClose).toHaveBeenCalled();
    });
  });

  test('should not have a default country when no country is provided', () => {
    render(
      <PhoneNumberStep
        phoneNumber={undefined}
        setPhoneNumber={mockSetPhoneNumber}
        handleClose={mockHandleClose}
        handlePhoneNumberSubmit={mockHandlePhoneNumberSubmit}
        setCountry={mockSetCountry}
        country={undefined as any}
      />,
    );

    // The country select should be present but not have a default selected value
    const countrySelect = screen.getByTestId('country-code-select');
    expect(countrySelect).toBeInTheDocument();

    // The input value should be empty (no default country)
    const selectInput = countrySelect.querySelector('input');
    expect(selectInput).toHaveValue('');

    // No country calling code should be displayed when no country is selected
    const phoneInput = screen.getByTestId('tel-input');
    expect(
      phoneInput.querySelector('[data-testid="tel-input"] input'),
    ).toHaveValue('');
  });

  test('should not display duplicate country code in phone input field', () => {
    const usPhoneNumber = parsePhoneNumber('+17373072270', 'US');
    render(
      <PhoneNumberStep
        phoneNumber={usPhoneNumber.number}
        setPhoneNumber={mockSetPhoneNumber}
        handleClose={mockHandleClose}
        handlePhoneNumberSubmit={mockHandlePhoneNumberSubmit}
        setCountry={mockSetCountry}
        country="US"
      />,
    );

    const phoneInput = screen.getByTestId('tel-input');
    const inputElement = phoneInput.querySelector('input');
    const inputValue = inputElement?.value || '';
    expect(inputValue).toBe('+1 737 307 2270');
  });

  describe('Analytics tracking', () => {
    test('calls trackAnalytics with correct parameters when Send Code is clicked', async () => {
      renderComponent(phoneNumber);
      const sendCodeButton = screen.getByRole('button', { name: /Send code/i });

      const clickEvent = fireEvent.click(sendCodeButton);

      await waitFor(() => {
        expect(mockTrackAnalytics).toHaveBeenCalledWith(
          'Send Code',
          'Verification',
          window.location.href,
          undefined,
          'cta',
        );
      });
      expect(mockHandlePhoneNumberSubmit).toHaveBeenCalled();
      expect(clickEvent).toBe(false); // Event was prevented
    });

    test('calls trackAnalytics with correct parameters when Cancel is clicked', async () => {
      renderComponent(phoneNumber);
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });

      const clickEvent = fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(mockTrackAnalytics).toHaveBeenCalledWith(
          'Cancel Verification',
          'Verification',
          window.location.href,
          undefined,
          'cta',
        );
      });
      expect(mockHandleClose).toHaveBeenCalled();
      expect(clickEvent).toBe(false); // Event was prevented
    });
  });
});
