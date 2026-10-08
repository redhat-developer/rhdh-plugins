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

import type { LoggerService } from '@backstage/backend-plugin-api';
import { KagentiApiClient } from './KagentiApiClient';
import { KeycloakAuthClient } from '@red-hat-developer-hub/backstage-plugin-boost-node';

function createMockLogger(): LoggerService {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
}

describe('KagentiApiClient', () => {
  let logger: LoggerService;

  beforeEach(() => {
    logger = createMockLogger();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('without auth', () => {
    it('sends request without Authorization header', async () => {
      const client = new KagentiApiClient({
        baseUrl: 'http://kagenti:8080',
        logger,
      });

      const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      await client.requestCore({
        method: 'POST',
        path: '/a2a/tasks',
        body: { id: 'task-1' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://kagenti:8080/a2a/tasks',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: 'task-1' }),
        }),
      );
    });
  });

  describe('with auth', () => {
    let authClient: KeycloakAuthClient;

    beforeEach(() => {
      authClient = new KeycloakAuthClient(
        {
          tokenEndpoint: 'http://keycloak/token',
          clientId: 'test-client',
          clientSecret: 'test-secret',
        },
        60,
      );
    });

    it('injects bearer token into requests', async () => {
      jest.spyOn(authClient, 'getBearerToken').mockResolvedValue('my-token');

      const client = new KagentiApiClient({
        baseUrl: 'http://kagenti:8080',
        logger,
        authClient,
      });

      const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      await client.requestCore({
        method: 'POST',
        path: '/a2a/tasks',
        body: { id: 'task-1' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://kagenti:8080/a2a/tasks',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        }),
      );
    });

    it('retries once on 401 with fresh token', async () => {
      const getBearerToken = jest
        .spyOn(authClient, 'getBearerToken')
        .mockResolvedValueOnce('stale-token')
        .mockResolvedValueOnce('fresh-token');
      const invalidate = jest.spyOn(authClient, 'invalidateToken');

      const client = new KagentiApiClient({
        baseUrl: 'http://kagenti:8080',
        logger,
        authClient,
      });

      const mockFetch = jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
        } as Response);

      const response = await client.requestCore({
        method: 'POST',
        path: '/a2a/tasks',
        body: { id: 'task-1' },
      });

      expect(response.status).toBe(200);
      expect(invalidate).toHaveBeenCalledTimes(1);
      expect(getBearerToken).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('propagates 401 after retry fails', async () => {
      jest
        .spyOn(authClient, 'getBearerToken')
        .mockResolvedValueOnce('stale-token')
        .mockResolvedValueOnce('still-bad-token');

      const client = new KagentiApiClient({
        baseUrl: 'http://kagenti:8080',
        logger,
        authClient,
      });

      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      const response = await client.requestCore({
        method: 'POST',
        path: '/a2a/tasks',
        body: { id: 'task-1' },
      });

      // Second 401 is propagated, not retried again
      expect(response.status).toBe(401);
      expect(logger.error).toHaveBeenCalledWith(
        'Received 401 from Kagenti after token refresh retry',
      );
    });

    it('does not retry on 401 without auth client', async () => {
      const client = new KagentiApiClient({
        baseUrl: 'http://kagenti:8080',
        logger,
      });

      const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      const response = await client.requestCore({
        method: 'POST',
        path: '/a2a/tasks',
        body: { id: 'task-1' },
      });

      expect(response.status).toBe(401);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('X-Backstage-User header', () => {
    it('sets header when userRef is provided', async () => {
      const client = new KagentiApiClient({
        baseUrl: 'http://kagenti:8080',
        logger,
      });

      const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      await client.requestCore({
        method: 'POST',
        path: '/a2a/tasks',
        body: { id: 'task-1' },
        userRef: 'user:default/john',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://kagenti:8080/a2a/tasks',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Backstage-User': 'user:default/john',
          }),
        }),
      );
    });

    it('omits header when userRef is not provided', async () => {
      const client = new KagentiApiClient({
        baseUrl: 'http://kagenti:8080',
        logger,
      });

      const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      await client.requestCore({
        method: 'POST',
        path: '/a2a/tasks',
        body: { id: 'task-1' },
      });

      const calledHeaders = (mockFetch.mock.calls[0][1] as RequestInit)
        .headers as Record<string, string>;
      expect(calledHeaders['X-Backstage-User']).toBeUndefined();
    });
  });

  describe('auth and user header together', () => {
    it('includes both Authorization and X-Backstage-User', async () => {
      const authClient = new KeycloakAuthClient(
        {
          tokenEndpoint: 'http://keycloak/token',
          clientId: 'test-client',
          clientSecret: 'test-secret',
        },
        60,
      );
      jest.spyOn(authClient, 'getBearerToken').mockResolvedValue('my-token');

      const client = new KagentiApiClient({
        baseUrl: 'http://kagenti:8080',
        logger,
        authClient,
      });

      const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      await client.requestCore({
        method: 'POST',
        path: '/a2a/tasks',
        body: { id: 'task-1' },
        userRef: 'user:default/jane',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://kagenti:8080/a2a/tasks',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
            'X-Backstage-User': 'user:default/jane',
          }),
        }),
      );
    });
  });
});
