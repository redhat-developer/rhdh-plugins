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

import {
  extractResponseError,
  isHttpSuccessResponse,
} from './extractResponseError';

describe('isHttpSuccessResponse', () => {
  it('uses ok when set', () => {
    expect(isHttpSuccessResponse({ ok: true, status: 200 } as Response)).toBe(
      true,
    );
    expect(isHttpSuccessResponse({ ok: false, status: 500 } as Response)).toBe(
      false,
    );
  });

  it('falls back to status when ok is undefined', () => {
    expect(isHttpSuccessResponse({ status: 200 } as unknown as Response)).toBe(
      true,
    );
    expect(isHttpSuccessResponse({ status: 409 } as unknown as Response)).toBe(
      false,
    );
  });
});

describe('extractResponseError', () => {
  it('parses Backstage error object', async () => {
    const message = await extractResponseError(
      {
        json: async () => ({
          error: { name: 'NotFoundError', message: 'Project not found' },
        }),
      },
      'fallback',
    );
    expect(message).toBe('Project not found');
  });

  it('parses x2a POST /projects/:id/run 409 conflict body', async () => {
    const message = await extractResponseError(
      {
        json: async () => ({
          error: 'JobAlreadyRunning',
          message: 'An init job is already running for this project',
          details: 'Please wait',
        }),
      },
      'fallback',
    );
    expect(message).toBe('An init job is already running for this project');
  });

  it('uses top-level message when error shape is unknown', async () => {
    const message = await extractResponseError(
      {
        json: async () => ({ message: 'Something went wrong' }),
      },
      'fallback',
    );
    expect(message).toBe('Something went wrong');
  });

  it('returns fallback on parse failure', async () => {
    const message = await extractResponseError(
      {
        json: async () => {
          throw new Error('bad json');
        },
      },
      'fallback',
    );
    expect(message).toBe('fallback');
  });
});
