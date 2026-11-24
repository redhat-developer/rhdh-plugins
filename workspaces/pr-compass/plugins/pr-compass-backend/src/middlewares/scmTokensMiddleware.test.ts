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
import { InputError } from '@backstage/errors';
import type { Request, Response } from 'express';
import { SCM_TOKENS_HEADER } from '../validation';
import { createScmTokensMiddleware, getScmTokens } from '.';

const logger = mockServices.logger.mock();

describe('createScmTokensMiddleware', () => {
  function run(headerValue?: string) {
    const req = {
      headers: headerValue
        ? { [SCM_TOKENS_HEADER]: headerValue, 'x-other': 'kept' }
        : { 'x-other': 'kept' },
    } as unknown as Request;
    const res = { locals: {} } as unknown as Response;
    const next = jest.fn();

    createScmTokensMiddleware(logger)(req, res, next);

    return { req, res, next };
  }

  it('removes the header so later middleware cannot log the token', () => {
    const { req } = run('{"github:github.com":"ghu_abc"}');

    expect(req.headers[SCM_TOKENS_HEADER]).toBeUndefined();
    expect(req.headers['x-other']).toBe('kept');
  });

  it('saves the parsed map on res.locals', () => {
    const { res, next } = run('{"github:github.com":"ghu_abc"}');

    expect(getScmTokens(res)).toEqual({ 'github:github.com': 'ghu_abc' });
    expect(next).toHaveBeenCalledWith();
  });

  it('yields an empty map when no header was sent', () => {
    const { res, next } = run();

    expect(getScmTokens(res)).toEqual({});
    expect(next).toHaveBeenCalledWith();
  });

  it('still removes the header when the value is invalid', () => {
    const { req, next } = run('nonsense');

    expect(req.headers[SCM_TOKENS_HEADER]).toBeUndefined();
    expect(next).toHaveBeenCalledWith(expect.any(InputError));
  });
});
