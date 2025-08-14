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
import { PhoneNumberStep } from '../PhoneNumberStep';
import { E164Number } from 'libphonenumber-js/types';
import { Country } from 'react-phone-number-input';
import { parsePhoneNumber } from 'libphonenumber-js/min';
import { PhoneNumber } from 'libphonenumber-js';

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
  const mockSetPhoneNumber = jest.fn();
  const mockHandleClose = jest.fn();
  const mockHandlePhoneNumberSubmit = jest.fn();
  const mockSetCountry = jest.fn();
  const phoneNumber = parsePhoneNumber(' 8 (800) 555-35-35 ', 'RU');

  beforeEach(() => {
    jest.clearAllMocks();
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

  test('should submit phone number when clicking send code button', () => {
    renderComponent(phoneNumber);
    // Find and click send code button
    const submitPhoneNumberButton = screen.getByRole('button', {
      name: /Send code/i,
    });
    fireEvent.click(submitPhoneNumberButton);
    expect(mockHandlePhoneNumberSubmit).toHaveBeenCalled();
  });

  test('should show an error when phone number is invalid', () => {
    const invalidPhoneNumber = parsePhoneNumber(' 8 (800) xxxx ', 'RU');
    renderComponent(invalidPhoneNumber, 'invalid phone number error');
    // Find and click send code
    const submitPhoneNumberButton = screen.getByRole('button', {
      name: /Send code/i,
    });
    fireEvent.click(submitPhoneNumberButton);
    // submit the phone number to backend
    expect(mockHandlePhoneNumberSubmit).toHaveBeenCalled();
    // expect mock error from backend to be displayed
    expect(screen.getByText('invalid phone number error')).toBeInTheDocument();
    // submit button should be enabled so user can retry with new number
    expect(screen.getByText(/Send code/i).closest('button')).toBeEnabled();
  });

  test('closes the modal when the close button is clicked', () => {
    renderComponent(phoneNumber);
    const closeButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(closeButton);
    expect(mockHandleClose).toHaveBeenCalled();
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

  describe('EDDL data attributes', () => {
    test('should have correct EDDL data attributes on Send Code button', () => {
      renderComponent(phoneNumber);

      const sendCodeButton = screen.getByRole('button', { name: /Send code/i });

      expect(sendCodeButton).toHaveAttribute(
        'data-analytics-category',
        'Developer Sandbox|Verification',
      );
      expect(sendCodeButton).toHaveAttribute(
        'data-analytics-text',
        'Send Code',
      );
      expect(sendCodeButton).toHaveAttribute(
        'data-analytics-region',
        'sandbox-verification',
      );
    });

    test('should have correct EDDL data attributes on Cancel button', () => {
      renderComponent(phoneNumber);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });

      expect(cancelButton).toHaveAttribute(
        'data-analytics-category',
        'Developer Sandbox|Verification',
      );
      expect(cancelButton).toHaveAttribute(
        'data-analytics-text',
        'Cancel Verification',
      );
      expect(cancelButton).toHaveAttribute(
        'data-analytics-region',
        'sandbox-verification',
      );
    });
  });
});
