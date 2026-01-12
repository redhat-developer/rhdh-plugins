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

import { ConfigApi } from '@backstage/core-plugin-api';
import { RegistrationBackendClient } from '../RegistrationBackendClient';
import { SecureFetchApi } from '../SecureFetchClient';

// Helper to create a mock Response object
const createMockResponse = (options: {
  ok: boolean;
  status?: number;
  statusText?: string;
  json?: () => Promise<any>;
}): Response => {
  const { ok, status = 200, statusText = '', json } = options;
  return {
    ok,
    status,
    statusText,
    headers: new Headers(),
    redirected: false,
    type: 'basic',
    url: 'http://mock',
    json: json || (() => Promise.resolve({})),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData()),
    bodyUsed: false,
    body: null,
    clone: function () {
      return this;
    },
  } as Response;
};

describe('RegistrationBackendClient', () => {
  let mockConfigApi: jest.Mocked<ConfigApi>;
  let mockSecureFetchApi: jest.Mocked<SecureFetchApi>;
  let client: RegistrationBackendClient;

  beforeEach(() => {
    mockConfigApi = {
      getString: jest.fn(),
      getOptionalString: jest.fn(),
    } as any;

    mockSecureFetchApi = {
      fetch: jest.fn(),
    } as any;

    client = new RegistrationBackendClient({
      configApi: mockConfigApi,
      secureFetchApi: mockSecureFetchApi,
    });

    // Mock the global grecaptcha object
    (global as any).grecaptcha = {
      enterprise: {
        ready: jest.fn(callback => callback()),
        execute: jest.fn(),
      },
    };
  });

  describe('getRecaptchaAPIKey', () => {
    it('should return configured API key', () => {
      mockConfigApi.getOptionalString.mockReturnValue('test-key');
      expect(client.getRecaptchaAPIKey()).toBe('test-key');
    });

    it('should return default API key if not configured', () => {
      mockConfigApi.getOptionalString.mockReturnValue(undefined);
      expect(client.getRecaptchaAPIKey()).toBe('test-api-key');
    });
  });

  describe('getSignUpData', () => {
    it('should return signup data on successful response', async () => {
      mockConfigApi.getString.mockReturnValue('http://api');
      const mockData = { someData: 'value' };
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: true,
          json: () => Promise.resolve(mockData),
        }),
      );

      const result = await client.getSignUpData();
      expect(result).toEqual(mockData);
    });

    it('should return undefined on 404 response', async () => {
      mockConfigApi.getString.mockReturnValue('http://api');
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 404,
        }),
      );

      const result = await client.getSignUpData();
      expect(result).toBeUndefined();
    });

    it('should throw error on other unsuccessful responses', async () => {
      mockConfigApi.getString.mockReturnValue('http://api');
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 500,
          statusText: 'Server Error',
        }),
      );

      await expect(client.getSignUpData()).rejects.toThrow(
        'Unexpected status code: 500 Server Error',
      );
    });
  });

  describe('initiatePhoneVerification', () => {
    const validCountryCode = '+1';
    const validPhoneNumber = '1234567890';

    beforeEach(() => {
      mockConfigApi.getString.mockReturnValue('http://api');
    });

    it('should successfully initiate phone verification', async () => {
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: true,
        }),
      );

      await expect(
        client.initiatePhoneVerification(validCountryCode, validPhoneNumber),
      ).resolves.not.toThrow();
    });

    it('should throw error for invalid phone number format', async () => {
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 400,
          json: () =>
            Promise.resolve({
              message: "Invalid 'To' Phone Number",
            }),
        }),
      );

      await expect(
        client.initiatePhoneVerification(validCountryCode, validPhoneNumber),
      ).rejects.toThrow(
        'Invalid phone number. Please verify the country code and number format, then try again.',
      );
    });

    it('should throw error for already used phone number', async () => {
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 400,
          json: () =>
            Promise.resolve({
              message: 'phone number already in use',
            }),
        }),
      );

      await expect(
        client.initiatePhoneVerification(validCountryCode, validPhoneNumber),
      ).rejects.toThrow(
        'This phone number is already in use. Please use a different number.',
      );
    });
  });

  describe('completePhoneVerification', () => {
    const validCode = '123456';

    beforeEach(() => {
      mockConfigApi.getString.mockReturnValue('http://api');
    });

    it('should successfully complete phone verification', async () => {
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: true,
        }),
      );

      await expect(
        client.completePhoneVerification(validCode),
      ).resolves.not.toThrow();
    });

    it('should throw error on unsuccessful verification', async () => {
      const errorMessage = 'Invalid verification code';
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 400,
          json: () =>
            Promise.resolve({
              message: errorMessage,
            }),
        }),
      );

      await expect(client.completePhoneVerification(validCode)).rejects.toThrow(
        errorMessage,
      );
    });
  });

  describe('verifyActivationCode', () => {
    const validCode = '123456';

    beforeEach(() => {
      mockConfigApi.getString.mockReturnValue('http://api');
    });

    it('should successfully verify activation code', async () => {
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: true,
        }),
      );

      await expect(
        client.verifyActivationCode(validCode),
      ).resolves.not.toThrow();
    });

    it('should throw error on unsuccessful verification', async () => {
      const errorMessage = 'Invalid activation code';
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 400,
          json: () =>
            Promise.resolve({
              message: errorMessage,
            }),
        }),
      );

      await expect(client.verifyActivationCode(validCode)).rejects.toThrow(
        errorMessage,
      );
    });
  });

  describe('getUIConfig', () => {
    it('should return UI config with workatoWebHookURL', async () => {
      const mockUIConfig = {
        workatoWebHookURL: 'https://webhooks.test',
      };

      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: true,
          json: () => Promise.resolve(mockUIConfig),
        }),
      );

      const result = await client.getUIConfig();

      expect(result).toEqual(mockUIConfig);
      expect(mockSecureFetchApi.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/uiconfig'),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should return empty config if workatoWebHookURL is not present', async () => {
      const mockUIConfig = {};

      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: true,
          json: () => Promise.resolve(mockUIConfig),
        }),
      );

      const result = await client.getUIConfig();

      expect(result).toEqual({});
      expect(result.workatoWebHookURL).toBeUndefined();
    });

    it('should return empty config on unsuccessful response', async () => {
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 500,
          json: () => Promise.resolve({}),
        }),
      );

      const result = await client.getUIConfig();

      expect(result).toEqual({});
    });

    it('should return empty config on fetch error', async () => {
      mockSecureFetchApi.fetch.mockRejectedValue(new Error('Network failure'));

      const result = await client.getUIConfig();

      expect(result).toEqual({});
    });
  });
});
