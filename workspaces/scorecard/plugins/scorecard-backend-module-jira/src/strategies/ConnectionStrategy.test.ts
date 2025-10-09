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

import { mockServices } from '@backstage/backend-test-utils';
import {
  DirectConnectionStrategy,
  ProxyConnectionStrategy,
} from './ConnectionStrategy';

const mockAuth = mockServices.auth();
const mockDiscovery = mockServices.discovery();

describe('ConnectionStrategy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DirectConnectionStrategy', () => {
    const connectionStrategy = new DirectConnectionStrategy(
      'https://example.com/api',
      'Fds31dsF32',
      'cloud',
    );

    describe('constructor', () => {
      it('should create a DirectConnectionStrategy', () => {
        expect(connectionStrategy).toBeInstanceOf(DirectConnectionStrategy);
      });
    });

    describe('getBaseUrl', () => {
      it('should return correct base URL', async () => {
        const baseUrl = await connectionStrategy.getBaseUrl(2);
        expect(baseUrl).toEqual('https://example.com/api/rest/api/2');
      });
    });

    describe('getAuthHeaders', () => {
      it('should return Basic auth headers when product is cloud', async () => {
        const authHeaders = await connectionStrategy.getAuthHeaders();
        expect(authHeaders).toEqual({ Authorization: 'Basic Fds31dsF32' });
      });

      it('should return Bearer auth headers when product is datacenter', async () => {
        const dataCenterStrategy = new DirectConnectionStrategy(
          'https://example.com/api',
          'Fds31dsF32',
          'datacenter',
        );
        const authHeaders = await dataCenterStrategy.getAuthHeaders();
        expect(authHeaders).toEqual({ Authorization: 'Bearer Fds31dsF32' });
      });
    });
  });

  describe('ProxyConnectionStrategy', () => {
    const connectionStrategy = new ProxyConnectionStrategy(
      '/jira/api',
      mockAuth,
      mockDiscovery,
    );

    describe('constructor', () => {
      it('should create a ProxyConnectionStrategy', () => {
        expect(connectionStrategy).toBeInstanceOf(ProxyConnectionStrategy);
      });
    });

    describe('getBaseUrl', () => {
      it('should return correct base URL', async () => {
        const baseUrl = await connectionStrategy.getBaseUrl(2);
        expect(baseUrl).toEqual(
          'http://localhost:0/api/proxy/jira/api/rest/api/2',
        );
      });
    });

    describe('getAuthHeaders', () => {
      it('should return Bearer auth headers when service token is present', async () => {
        jest
          .spyOn(mockAuth, 'getPluginRequestToken')
          .mockResolvedValue({ token: 'Fds31dsF32' });

        const authHeaders = await connectionStrategy.getAuthHeaders();
        expect(authHeaders).toEqual({ Authorization: 'Bearer Fds31dsF32' });
      });

      it('should return an empty object when service token is not present', async () => {
        jest
          .spyOn(mockAuth, 'getPluginRequestToken')
          .mockResolvedValue({ token: '' });

        const authHeaders = await connectionStrategy.getAuthHeaders();
        expect(authHeaders).toEqual({});
      });
    });

    describe('getServiceToken', () => {
      it('should return the service token', async () => {
        jest
          .spyOn(mockAuth, 'getPluginRequestToken')
          .mockResolvedValue({ token: 'Fds31dsF32' });

        const serviceToken = await (
          connectionStrategy as any
        ).getServiceToken();
        expect(serviceToken).toEqual('Fds31dsF32');
      });
    });
  });
});
