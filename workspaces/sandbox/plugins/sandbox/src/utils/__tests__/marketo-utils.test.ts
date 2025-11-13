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

import { trackMarketoEvent } from '../marketo-utils';
import { SignupData } from '../../types';
import * as cookieUtils from '../cookie-utils';

// Mock fetch globally
global.fetch = jest.fn();

// Mock cookie-utils
jest.mock('../cookie-utils', () => ({
  getCookie: jest.fn(),
}));

describe('Marketo Utils', () => {
  let documentCookie: string;
  let consoleDebugSpy: jest.SpyInstance;

  const mockUserData: SignupData = {
    name: 'John Doe',
    compliantUsername: 'jdoe',
    username: 'jdoe',
    givenName: 'John',
    familyName: 'Doe',
    company: 'Red Hat',
    email: 'jdtest@test.com',
    userID: 'user123',
    accountID: 'account456',
    accountNumber: 'EBS123',
    status: {
      ready: true,
      reason: 'Provisioned',
      verificationRequired: false,
    },
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
    });

    // Mock document.cookie
    documentCookie = '';
    Object.defineProperty(document, 'cookie', {
      get: () => documentCookie,
      set: (value: string) => {
        documentCookie = value;
      },
      configurable: true,
    });

    // Mock console.debug to suppress debug messages in tests
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();

    // Mock Date for consistent timestamps
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-10-20T14:57:46.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleDebugSpy.mockRestore();
  });

  describe('trackMarketoEvent', () => {
    const mockWebhookURL = 'https://webhooks.test';

    it('should send correct payload to Marketo webhook', async () => {
      // Mock cookies
      (cookieUtils.getCookie as jest.Mock).mockImplementation(
        (name: string) => {
          if (name === 'rh_omni_tc') return 'RHCTN1250000786344';
          if (name === 'rh_omni_itc') return 'RHCTE1250000786360';
          return '';
        },
      );

      await trackMarketoEvent(
        mockUserData,
        '701Pe00000dnCEYIA2',
        mockWebhookURL,
      );

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(mockWebhookURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          C_FirstName: 'John',
          C_LastName: 'Doe',
          C_EmailAddress: 'jdtest@test.com',
          C_Company: 'Red Hat',
          A_Timestamp: '2025/10/20 14:57:46',
          F_FormData_Source: 'sandbox-redhat-com-integration',
          A_OfferID: '701Pe00000dnCEYIA2',
          A_TacticID_External: 'RHCTN1250000786344',
          A_TacticID_Internal: 'RHCTE1250000786360',
          Status: 'Engaged',
        }),
      });
    });

    it('should not send data if userData is undefined', async () => {
      await trackMarketoEvent(undefined, '701Pe00000dnCEYIA2', mockWebhookURL);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should not send data if email is missing', async () => {
      const userDataWithoutEmail = { ...mockUserData, email: undefined };

      await trackMarketoEvent(
        userDataWithoutEmail,
        '701Pe00000dnCEYIA2',
        mockWebhookURL,
      );

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should not send data if webhookURL is missing', async () => {
      (cookieUtils.getCookie as jest.Mock).mockReturnValue('');

      await trackMarketoEvent(mockUserData, '701Pe00000dnCEYIA2', undefined);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle empty company field', async () => {
      (cookieUtils.getCookie as jest.Mock).mockReturnValue('');

      const userDataWithoutCompany = { ...mockUserData, company: '' };

      await trackMarketoEvent(
        userDataWithoutCompany,
        '701Pe00000dnCEYIA2',
        mockWebhookURL,
      );

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);
      expect(payload.C_Company).toBe('');
    });

    it('should handle missing cookies', async () => {
      (cookieUtils.getCookie as jest.Mock).mockReturnValue('');

      await trackMarketoEvent(
        mockUserData,
        '701Pe00000dnCEYIA2',
        mockWebhookURL,
      );

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);
      expect(payload.A_TacticID_External).toBe('');
      expect(payload.A_TacticID_Internal).toBe('');
    });

    it('should handle missing offerID', async () => {
      (cookieUtils.getCookie as jest.Mock).mockReturnValue('');

      await trackMarketoEvent(mockUserData, undefined, mockWebhookURL);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);
      expect(payload.A_OfferID).toBe('');
    });

    it('should format timestamp correctly in UTC', async () => {
      (cookieUtils.getCookie as jest.Mock).mockReturnValue('');

      // Test with a different timestamp
      jest.setSystemTime(new Date('2025-01-15T09:30:45.123Z'));

      await trackMarketoEvent(
        mockUserData,
        '701Pe00000dnCEYIA2',
        mockWebhookURL,
      );

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);
      expect(payload.A_Timestamp).toBe('2025/01/15 09:30:45');
    });

    it('should handle fetch errors gracefully without throwing', async () => {
      (cookieUtils.getCookie as jest.Mock).mockReturnValue('');
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Should not throw
      await expect(
        trackMarketoEvent(mockUserData, '701Pe00000dnCEYIA2', mockWebhookURL),
      ).resolves.not.toThrow();

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        'Marketo tracking failed:',
        expect.any(Error),
      );
    });

    it('should handle fetch response errors gracefully', async () => {
      (cookieUtils.getCookie as jest.Mock).mockReturnValue('');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      // Should not throw even on error response
      await expect(
        trackMarketoEvent(mockUserData, '701Pe00000dnCEYIA2', mockWebhookURL),
      ).resolves.not.toThrow();
    });

    it('should always set F_FormData_Source to sandbox-redhat-com-integration', async () => {
      (cookieUtils.getCookie as jest.Mock).mockReturnValue('');

      await trackMarketoEvent(
        mockUserData,
        '701Pe00000dnCEYIA2',
        mockWebhookURL,
      );

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);
      expect(payload.F_FormData_Source).toBe('sandbox-redhat-com-integration');
    });

    it('should always set Status to Engaged', async () => {
      (cookieUtils.getCookie as jest.Mock).mockReturnValue('');

      await trackMarketoEvent(
        mockUserData,
        '701Pe00000dnCEYIA2',
        mockWebhookURL,
      );

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);
      expect(payload.Status).toBe('Engaged');
    });

    it('should call getCookie with correct cookie names', async () => {
      const getCookieMock = cookieUtils.getCookie as jest.Mock;
      getCookieMock.mockReturnValue('');

      await trackMarketoEvent(
        mockUserData,
        '701Pe00000dnCEYIA2',
        mockWebhookURL,
      );

      expect(getCookieMock).toHaveBeenCalledWith('rh_omni_tc');
      expect(getCookieMock).toHaveBeenCalledWith('rh_omni_itc');
    });
  });
});
