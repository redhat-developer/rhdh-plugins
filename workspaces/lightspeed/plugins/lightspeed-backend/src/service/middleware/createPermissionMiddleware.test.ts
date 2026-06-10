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

import { NotAllowedError } from '@backstage/errors';
import { createPermission } from '@backstage/plugin-permission-common';

import type { Request, Response } from 'express';

import { createPermissionMiddleware } from './createPermissionMiddleware';

const testPermission = createPermission({
  name: 'test.read',
  attributes: { action: 'read' },
});

function makeMockReq(): Request {
  return {
    credentials: { $$type: '@backstage/BackstageCredentials' },
    userEntityRef: 'user:default/test-user',
  } as unknown as Request;
}

function makeMockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: unknown) {
      res.body = data;
      return res;
    },
  };
  return res as typeof res & Response;
}

describe('createPermissionMiddleware', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };

  afterEach(() => jest.clearAllMocks());

  it('calls next() when authorization succeeds', async () => {
    const authorizer = {
      authorizeUser: jest.fn().mockResolvedValue(undefined),
    };
    const middleware = createPermissionMiddleware(
      authorizer,
      testPermission,
      mockLogger as any,
    );

    const next = jest.fn();
    await middleware(makeMockReq(), makeMockRes(), next);

    expect(authorizer.authorizeUser).toHaveBeenCalledWith(
      testPermission,
      expect.anything(),
    );
    expect(next).toHaveBeenCalled();
  });

  it('returns 403 when authorization is denied', async () => {
    const authorizer = {
      authorizeUser: jest
        .fn()
        .mockRejectedValue(new NotAllowedError('Unauthorized')),
    };
    const middleware = createPermissionMiddleware(
      authorizer,
      testPermission,
      mockLogger as any,
    );

    const res = makeMockRes();
    const next = jest.fn();
    await middleware(makeMockReq(), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'Unauthorized' });
    expect(mockLogger.error).toHaveBeenCalledWith('Unauthorized');
  });

  it('returns 500 on unexpected authorization failure', async () => {
    const authorizer = {
      authorizeUser: jest
        .fn()
        .mockRejectedValue(new Error('Connection refused')),
    };
    const middleware = createPermissionMiddleware(
      authorizer,
      testPermission,
      mockLogger as any,
    );

    const res = makeMockRes();
    const next = jest.fn();
    await middleware(makeMockReq(), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Internal authorization error' });
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Unexpected authorization error'),
    );
  });
});
