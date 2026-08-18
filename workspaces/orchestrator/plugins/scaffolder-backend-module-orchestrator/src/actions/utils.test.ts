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

import { AuthService } from '@backstage/backend-plugin-api';
import { DiscoveryApi } from '@backstage/plugin-permission-common';

import axios from 'axios';

import {
  Configuration,
  DefaultApi,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { getError, getOrchestratorApi, getRequestConfigOption } from './utils';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
  },
  isAxiosError: (error: { isAxiosError?: boolean }) =>
    Boolean(error?.isAxiosError),
}));

jest.mock(
  '@red-hat-developer-hub/backstage-plugin-orchestrator-common',
  () => ({
    Configuration: jest.fn(),
    DefaultApi: jest.fn(),
  }),
);

const mockedAxios = jest.mocked(axios);
const MockedConfiguration = jest.mocked(Configuration);
const MockedDefaultApi = jest.mocked(DefaultApi);

describe('utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getError', () => {
    it('maps axios errors with orchestrator payloads to Error instances', () => {
      const error = getError({
        isAxiosError: true,
        response: {
          data: {
            error: {
              message: 'Workflow execution failed',
              name: 'WorkflowError',
            },
          },
        },
      });

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Workflow execution failed');
      expect(error.name).toBe('WorkflowError');
    });

    it('returns generic errors unchanged', () => {
      const original = new Error('plain error');

      expect(getError(original)).toBe(original);
    });
  });

  describe('getOrchestratorApi', () => {
    it('builds the orchestrator client from discovery base url', async () => {
      const discoveryService = {
        getBaseUrl: jest
          .fn()
          .mockResolvedValue('http://orchestrator.example.com'),
      } as unknown as jest.Mocked<DiscoveryApi>;
      const axiosInstance = { request: jest.fn() };
      const apiInstance = { executeWorkflow: jest.fn() };

      mockedAxios.create.mockReturnValue(axiosInstance as any);
      MockedConfiguration.mockImplementation(() => ({}) as any);
      MockedDefaultApi.mockImplementation(() => apiInstance as any);

      const api = await getOrchestratorApi(discoveryService);

      expect(discoveryService.getBaseUrl).toHaveBeenCalledWith('orchestrator');
      expect(MockedConfiguration).toHaveBeenCalledWith({});
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://orchestrator.example.com',
      });
      expect(MockedDefaultApi).toHaveBeenCalledWith(
        expect.anything(),
        'http://orchestrator.example.com',
        axiosInstance,
      );
      expect(api).toBe(apiInstance);
    });
  });

  describe('getRequestConfigOption', () => {
    it('uses the plugin request token when auth service returns one', async () => {
      const credentials = { principal: 'user:default/alice' };
      const ctx = {
        getInitiatorCredentials: jest.fn().mockResolvedValue(credentials),
        secrets: {
          backstageToken: 'fallback-token',
        },
      };
      const authService = {
        getPluginRequestToken: jest.fn().mockResolvedValue({
          token: 'plugin-request-token',
        }),
      } as unknown as jest.Mocked<AuthService>;

      const config = await getRequestConfigOption(authService, ctx);

      expect(ctx.getInitiatorCredentials).toHaveBeenCalledTimes(1);
      expect(authService.getPluginRequestToken).toHaveBeenCalledWith({
        onBehalfOf: credentials,
        targetPluginId: 'orchestrator',
      });
      expect(config).toEqual({
        headers: {
          Authorization: 'Bearer plugin-request-token',
        },
      });
    });

    it('falls back to the backstage secret when the auth service does not return a token', async () => {
      const ctx = {
        getInitiatorCredentials: jest.fn().mockResolvedValue({
          principal: 'user:default/bob',
        }),
        secrets: {
          backstageToken: 'fallback-token',
        },
      };
      const authService = {
        getPluginRequestToken: jest.fn().mockResolvedValue({
          token: undefined,
        }),
      } as unknown as jest.Mocked<AuthService>;

      const config = await getRequestConfigOption(authService, ctx);

      expect(config).toEqual({
        headers: {
          Authorization: 'Bearer fallback-token',
        },
      });
    });

    it('falls back to the backstage secret when the auth service returns undefined', async () => {
      const ctx = {
        getInitiatorCredentials: jest.fn().mockResolvedValue({
          principal: 'user:default/bob',
        }),
        secrets: {
          backstageToken: 'fallback-token',
        },
      };
      const authService = {
        getPluginRequestToken: jest.fn().mockResolvedValue(undefined),
      } as unknown as jest.Mocked<AuthService>;

      const config = await getRequestConfigOption(authService, ctx);

      expect(config).toEqual({
        headers: {
          Authorization: 'Bearer fallback-token',
        },
      });
    });
  });
});
