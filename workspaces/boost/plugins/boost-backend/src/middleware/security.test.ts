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
import {
  validateSecurityMode,
  authorizeLifecycleAction,
  createAgentResourceLoader,
  createToolResourceLoader,
} from './security';
import type { Request, Response } from 'express';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { NotAllowedError } from '@backstage/errors';
import { boostAgentRegisterPermission } from '@red-hat-developer-hub/backstage-plugin-boost-common';

function createMockLogger(): LoggerService {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
}

describe('validateSecurityMode', () => {
  let logger: LoggerService;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    logger = createMockLogger();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('returns "development-only-no-auth" when no mode is configured', () => {
    expect(validateSecurityMode(undefined, logger)).toBe(
      'development-only-no-auth',
    );
  });

  it('accepts "development-only-no-auth"', () => {
    expect(validateSecurityMode('development-only-no-auth', logger)).toBe(
      'development-only-no-auth',
    );
  });

  it('accepts "plugin-only"', () => {
    expect(validateSecurityMode('plugin-only', logger)).toBe('plugin-only');
  });

  it('accepts "full"', () => {
    expect(validateSecurityMode('full', logger)).toBe('full');
  });

  it('rejects "none" with clear error pointing to "development-only-no-auth"', () => {
    expect(() => validateSecurityMode('none', logger)).toThrow(
      'development-only-no-auth',
    );
    expect(() => validateSecurityMode('none', logger)).toThrow(
      'not a valid mode name',
    );
  });

  it('rejects invalid mode names', () => {
    expect(() => validateSecurityMode('invalid', logger)).toThrow(
      'Invalid security mode "invalid"',
    );
  });

  it('lists valid modes in error message', () => {
    expect(() => validateSecurityMode('invalid', logger)).toThrow(
      'development-only-no-auth, plugin-only, full',
    );
  });

  it('warns when development-only-no-auth is used in production', () => {
    process.env.NODE_ENV = 'production';
    validateSecurityMode('development-only-no-auth', logger);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('production environment'),
    );
  });

  it('does not warn in non-production environments', () => {
    process.env.NODE_ENV = 'development';
    validateSecurityMode('development-only-no-auth', logger);

    expect(logger.warn).not.toHaveBeenCalled();
  });
});

describe('authorizeLifecycleAction', () => {
  function createMockRequest(): Request {
    return {} as Request;
  }

  function createMockResponse(): Response {
    return {} as Response;
  }

  it('allows when fine-grained permission check passes', async () => {
    const next = jest.fn();
    const mockCredentials = { $$type: '@backstage/BackstageCredentials' };

    const middleware = authorizeLifecycleAction(
      boostAgentRegisterPermission,
      async () => undefined,
      {
        permissions: {
          authorize: jest
            .fn()
            .mockResolvedValue([{ result: AuthorizeResult.ALLOW }]),
          authorizeConditional: jest.fn(),
        },
        httpAuth: {
          credentials: jest.fn().mockResolvedValue(mockCredentials),
          issueUserCookie: jest.fn(),
        },
      },
    );

    await middleware(createMockRequest(), createMockResponse(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('falls back to admin permission on fine-grained deny', async () => {
    const next = jest.fn();
    const mockCredentials = { $$type: '@backstage/BackstageCredentials' };

    const authorizeMock = jest
      .fn()
      // First call: fine-grained permission → DENY
      .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }])
      // Second call: admin permission → ALLOW
      .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]);

    const middleware = authorizeLifecycleAction(
      boostAgentRegisterPermission,
      async () => undefined,
      {
        permissions: {
          authorize: authorizeMock,
          authorizeConditional: jest.fn(),
        },
        httpAuth: {
          credentials: jest.fn().mockResolvedValue(mockCredentials),
          issueUserCookie: jest.fn(),
        },
      },
    );

    await middleware(createMockRequest(), createMockResponse(), next);
    expect(next).toHaveBeenCalledWith();
    expect(authorizeMock).toHaveBeenCalledTimes(2);
  });

  it('denies when both fine-grained and admin checks fail', async () => {
    const next = jest.fn();
    const mockCredentials = { $$type: '@backstage/BackstageCredentials' };

    const authorizeMock = jest
      .fn()
      .mockResolvedValue([{ result: AuthorizeResult.DENY }]);

    const middleware = authorizeLifecycleAction(
      boostAgentRegisterPermission,
      async () => undefined,
      {
        permissions: {
          authorize: authorizeMock,
          authorizeConditional: jest.fn(),
        },
        httpAuth: {
          credentials: jest.fn().mockResolvedValue(mockCredentials),
          issueUserCookie: jest.fn(),
        },
      },
    );

    await middleware(createMockRequest(), createMockResponse(), next);

    // Should call next with a NotAllowedError
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(NotAllowedError);
  });
});

describe('resource loaders', () => {
  it('createAgentResourceLoader returns undefined (placeholder)', async () => {
    const loader = createAgentResourceLoader();
    const result = await loader({} as Request);
    expect(result).toBeUndefined();
  });

  it('createToolResourceLoader returns undefined (placeholder)', async () => {
    const loader = createToolResourceLoader();
    const result = await loader({} as Request);
    expect(result).toBeUndefined();
  });
});
