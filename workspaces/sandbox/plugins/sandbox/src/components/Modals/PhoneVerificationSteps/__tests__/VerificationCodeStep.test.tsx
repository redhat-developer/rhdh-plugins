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
import { E164Number } from 'libphonenumber-js/types';
import { parsePhoneNumber } from 'libphonenumber-js/min';
import VerificationCodeStep from '../VerificationCodeStep';
import { Product } from '../../../SandboxCatalog/productData';
import { Country } from 'react-phone-number-input';
import { useSandboxContext } from '../../../../hooks/useSandboxContext';
import { act } from 'react-dom/test-utils';
import * as eddlUtils from '../../../../utils/eddl-utils';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn().mockReturnValue({
    completePhoneVerification: jest.fn(),
  }),
}));

jest.useFakeTimers(); // control timers
// mock hooks
jest.mock('../../../../hooks/useSandboxContext');
jest.mock('../../../../utils/eddl-utils', () => ({
  ...jest.requireActual('../../../../utils/eddl-utils'),
  useTrackAnalytics: jest.fn(),
}));

// Mock the props interface if it's not exported from the component file
declare module '../VerificationCodeStep' {
  interface VerificationCodeProps {
    id: Product;
    otp: string[];
    setOtp: React.Dispatch<React.SetStateAction<string[]>>;
    country: Country | undefined;
    phoneNumber: E164Number | undefined;
    handleEditPhoneNumber: () => void;
    handleClose: () => void;
    setAnsibleCredsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    loading?: boolean;
  }
}

describe('VerificationCodeStep', () => {
  const mockTrackAnalytics = jest.fn();
  const mockSetOpt = jest.fn();
  const mockHandleClose = jest.fn();
  const mockHandleEditPhoneNumber = jest.fn();
  const mockSetLoading = jest.fn();
  const mockSetAnsibleCredsModalOpen = jest.fn();
  const mockRefetchingUserData = jest.fn();
  const mockRefetchAAP = jest.fn();
  const mockOpen = jest.fn();
  const otpCode: string[] = ['1', '2', '3', '4', '5'];
  const phoneNumber = parsePhoneNumber('8 (800) 555-35-35', 'RU');
  const mockCountry: Country = 'RU';

  const defaultUserData = {
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
  } as any;

  const defaultProps = {
    id: Product.OPENSHIFT_CONSOLE,
    otp: otpCode,
    setOtp: mockSetOpt,
    phoneNumber: phoneNumber.number,
    handleEditPhoneNumber: mockHandleEditPhoneNumber,
    handleClose: mockHandleClose,
    setLoading: mockSetLoading,
    setAnsibleCredsModalOpen: mockSetAnsibleCredsModalOpen,
    setRefetchingUserData: mockRefetchingUserData,
    loading: false,
    country: mockCountry,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrackAnalytics.mockResolvedValue(undefined);
    (eddlUtils.useTrackAnalytics as jest.Mock).mockReturnValue(
      mockTrackAnalytics,
    );
  });

  function renderComponent(props = {}) {
    render(<VerificationCodeStep {...defaultProps} {...props} />);
  }

  test('should render modal', () => {
    const mockRefetchUserData = jest.fn();
    const mockHandleAAPInstance = jest.fn();
    const mockUseSandboxContext = useSandboxContext as jest.MockedFunction<
      typeof useSandboxContext
    >;
    mockUseSandboxContext.mockReturnValue({
      refetchUserData: mockRefetchUserData,
      refetchAAP: mockRefetchAAP,
      handleAAPInstance: mockHandleAAPInstance,
    } as any);

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
    const mockRefetchUserData = jest.fn().mockReturnValue(defaultUserData);
    const mockHandleAAPInstance = jest.fn();
    const mockUseSandboxContext = useSandboxContext as jest.MockedFunction<
      typeof useSandboxContext
    >;
    mockUseSandboxContext.mockReturnValue({
      refetchUserData: mockRefetchUserData,
      refetchAAP: mockRefetchAAP,
      handleAAPInstance: mockHandleAAPInstance,
    } as any);

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
      `https://sandboxcluster.test//k8s/cluster/projects/bob-2-dev`,
      '_blank',
    ); // check it opens the url after signup
    mockOpen.mockRestore();
  });

  test('should submit opt code when clicking start trial and provision AAP', async () => {
    const mockRefetchUserData = jest.fn().mockReturnValue(defaultUserData);
    const mockHandleAAPInstance = jest.fn();
    const mockUseSandboxContext = useSandboxContext as jest.MockedFunction<
      typeof useSandboxContext
    >;
    mockUseSandboxContext.mockReturnValue({
      refetchUserData: mockRefetchUserData,
      refetchAAP: mockRefetchAAP,
      handleAAPInstance: mockHandleAAPInstance,
    } as any);

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

  test('closes the modal when the close button is clicked', async () => {
    const mockRefetchUserData = jest.fn();
    const mockHandleAAPInstance = jest.fn();
    const mockUseSandboxContext = useSandboxContext as jest.MockedFunction<
      typeof useSandboxContext
    >;
    mockUseSandboxContext.mockReturnValue({
      refetchUserData: mockRefetchUserData,
      refetchAAP: mockRefetchAAP,
      handleAAPInstance: mockHandleAAPInstance,
    } as any);

    renderComponent();
    const closeButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(mockHandleClose).toHaveBeenCalled();
    });
  });

  test('does not open URL when defaultUserNamespace is undefined', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    window.open = mockOpen; // override window.open with mock
    const mockHandleAAPInstance = jest.fn();
    const mockRefetchUserData = jest.fn().mockReturnValue({
      ...defaultUserData,
      defaultUserNamespace: undefined,
    });
    const mockUseSandboxContext = useSandboxContext as jest.MockedFunction<
      typeof useSandboxContext
    >;
    mockUseSandboxContext.mockReturnValue({
      refetchUserData: mockRefetchUserData,
      refetchAAP: mockRefetchAAP,
      handleAAPInstance: mockHandleAAPInstance,
    } as any);

    renderComponent();
    const submitButton = screen.getByRole('button', { name: /Start trial/i });
    await act(async () => {
      fireEvent.click(submitButton);
      // advance timers to trigger all retries
      for (let i = 0; i < 5; i++) {
        jest.advanceTimersByTime(1000);
        await Promise.resolve(); // allow awaiting the timer to flush
      }
    });

    expect(mockRefetchUserData).toHaveBeenCalled();
    await waitFor(
      () => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'user is ready but default namespace is not defined yet...',
        );
      },
      { timeout: 6000 },
    );
    consoleErrorSpy.mockRestore();
    expect(mockOpen).not.toHaveBeenCalled(); // verify window.open is not called
    mockOpen.mockRestore();
  });

  test('does not invoke handleAAP when defaultUserNamespace is undefined', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockHandleAAPInstance = jest.fn();
    const mockRefetchUserData = jest.fn().mockReturnValue({
      ...defaultUserData,
      defaultUserNamespace: undefined,
    });
    const mockUseSandboxContext = useSandboxContext as jest.MockedFunction<
      typeof useSandboxContext
    >;
    mockUseSandboxContext.mockReturnValue({
      refetchUserData: mockRefetchUserData,
      refetchAAP: mockRefetchAAP,
      handleAAPInstance: mockHandleAAPInstance,
    } as any);

    renderComponent({ id: Product.AAP });
    const submitButton = screen.getByRole('button', { name: /Start trial/i });
    await act(async () => {
      fireEvent.click(submitButton);
      // advance timers to trigger all retries
      for (let i = 0; i < 5; i++) {
        jest.advanceTimersByTime(1000);
        await Promise.resolve(); // allow awaiting the timer to flush
      }
    });

    expect(mockRefetchUserData).toHaveBeenCalled();
    expect(mockHandleAAPInstance).not.toHaveBeenCalled(); // verify handleAAP is not called
    await waitFor(
      () => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'user is ready but default namespace is not defined yet...',
        );
      },
      { timeout: 6000 },
    );
    consoleErrorSpy.mockRestore();
  });

  test('does not open URL when verification is required', async () => {
    window.open = mockOpen; // override window.open with mock
    const mockHandleAAPInstance = jest.fn();
    const mockRefetchUserData = jest.fn().mockReturnValue({
      ...defaultUserData,
      status: {
        ready: false,
        reason: 'VerificationRequired',
        verificationRequired: true,
      },
    });
    const mockUseSandboxContext = useSandboxContext as jest.MockedFunction<
      typeof useSandboxContext
    >;
    mockUseSandboxContext.mockReturnValue({
      refetchUserData: mockRefetchUserData,
      refetchAAP: mockRefetchAAP,
      handleAAPInstance: mockHandleAAPInstance,
    } as any);

    renderComponent();
    const submitButton = screen.getByRole('button', { name: /Start trial/i });
    await act(async () => {
      fireEvent.click(submitButton);
      // advance timers to trigger all retries
      for (let i = 0; i < 5; i++) {
        jest.advanceTimersByTime(1000);
        await Promise.resolve(); // allow awaiting the timer to flush
      }
    });

    expect(mockRefetchUserData).toHaveBeenCalled();
    expect(mockOpen).not.toHaveBeenCalled(); // verify window.open is not called
    mockOpen.mockRestore();
  });

  test('does not invoke handleAAP when verification is required', async () => {
    const mockHandleAAPInstance = jest.fn();
    const mockRefetchUserData = jest.fn().mockReturnValue({
      ...defaultUserData,
      status: {
        ready: false,
        reason: 'VerificationRequired',
        verificationRequired: true,
      },
    });
    const mockUseSandboxContext = useSandboxContext as jest.MockedFunction<
      typeof useSandboxContext
    >;
    mockUseSandboxContext.mockReturnValue({
      refetchUserData: mockRefetchUserData,
      refetchAAP: mockRefetchAAP,
      handleAAPInstance: mockHandleAAPInstance,
    } as any);

    renderComponent({ id: Product.AAP });
    const submitButton = screen.getByRole('button', { name: /Start trial/i });
    await act(async () => {
      fireEvent.click(submitButton);
      // advance timers to trigger all retries
      for (let i = 0; i < 5; i++) {
        jest.advanceTimersByTime(1000);
        await Promise.resolve(); // allow awaiting the timer to flush
      }
    });

    expect(mockRefetchUserData).toHaveBeenCalled();
    expect(mockHandleAAPInstance).not.toHaveBeenCalled(); // verify handleAAP is not called
  });

  describe('Analytics tracking', () => {
    let mockRefetchUserData: jest.Mock;
    let mockHandleAAPInstance: jest.Mock;

    beforeEach(() => {
      mockRefetchUserData = jest.fn();
      mockHandleAAPInstance = jest.fn();
      const mockUseSandboxContext = useSandboxContext as jest.MockedFunction<
        typeof useSandboxContext
      >;
      mockUseSandboxContext.mockReturnValue({
        refetchUserData: mockRefetchUserData,
        refetchAAP: mockRefetchAAP,
        handleAAPInstance: mockHandleAAPInstance,
      } as any);
    });

    test('calls trackAnalytics with correct parameters when Start Trial is clicked', async () => {
      renderComponent();

      const startTrialButton = screen.getByRole('button', {
        name: /Start trial/i,
      });
      const clickEvent = fireEvent.click(startTrialButton);

      await waitFor(() => {
        expect(mockTrackAnalytics).toHaveBeenCalledWith(
          'Start Trial',
          'Verification',
          window.location.href,
          undefined,
          'cta',
        );
      });
      expect(clickEvent).toBe(false); // Event was prevented
    });

    test('calls trackAnalytics with correct parameters when Resend Code is clicked', async () => {
      renderComponent();

      const resendCodeLink = screen.getByTestId('resend-code-link');
      const clickEvent = fireEvent.click(resendCodeLink);

      await waitFor(() => {
        expect(mockTrackAnalytics).toHaveBeenCalledWith(
          'Resend Code',
          'Verification',
          window.location.href,
          undefined,
          'cta',
        );
      });
      expect(clickEvent).toBe(false); // Event was prevented
    });

    test('calls trackAnalytics with correct parameters when Cancel is clicked', async () => {
      renderComponent();

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
