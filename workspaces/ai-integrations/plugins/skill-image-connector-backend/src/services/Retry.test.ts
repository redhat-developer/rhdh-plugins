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
import { HttpResponseError } from './HttpClient';
import { withRetry } from './Retry';

const logger = mockServices.logger.mock();
const options = { maxRetries: 2, retryBaseDelayMs: 2000 };
beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('withRetry', () => {
  it('waits two then four seconds before retrying and stops at the budget', async () => {
    let attempts = 0;
    const failure = Object.assign(new Error('socket closed'), {
      code: 'ECONNRESET',
    });
    const result = withRetry(
      async () => {
        attempts++;
        throw failure;
      },
      options,
      logger,
      'image',
    );
    const failureResult = result.catch(error => error);
    await jest.advanceTimersByTimeAsync(1999);
    expect(attempts).toBe(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(attempts).toBe(2);
    await jest.advanceTimersByTimeAsync(3999);
    expect(attempts).toBe(2);
    await jest.advanceTimersByTimeAsync(1);
    expect(await failureResult).toBe(failure);
    expect(attempts).toBe(3);
  });
  it.each([
    new HttpResponseError('server unavailable', 503),
    Object.assign(new TypeError('fetch failed'), {
      cause: Object.assign(new Error('connect'), {
        code: 'UND_ERR_CONNECT_TIMEOUT',
      }),
    }),
    Object.assign(new TypeError('fetch failed'), {
      cause: new AggregateError([
        Object.assign(new Error('connect'), { code: 'ECONNREFUSED' }),
      ]),
    }),
    new DOMException('deadline expired', 'TimeoutError'),
  ])('recovers from a transient failure: %p', async error => {
    let attempts = 0;
    const result = withRetry(
      async () => {
        if (++attempts === 1) throw error;
        return 'content';
      },
      options,
      logger,
      'image',
    );
    await jest.runAllTimersAsync();
    await expect(result).resolves.toBe('content');
    expect(attempts).toBe(2);
  });
  it.each([
    new HttpResponseError('upstream 503 in an error message', 404),
    new Error('validation failed for repository 500'),
    new Error('Registry response size exceeds maximum allowed size 503'),
    new DOMException('caller cancelled', 'AbortError'),
    new SyntaxError('invalid JSON'),
  ])('does not retry a permanent failure: %p', async error => {
    let attempts = 0;
    await expect(
      withRetry(
        async () => {
          attempts++;
          throw error;
        },
        options,
        logger,
        'image',
      ),
    ).rejects.toBe(error);
    expect(attempts).toBe(1);
    expect(jest.getTimerCount()).toBe(0);
  });
  it('honors zero retries', async () => {
    let attempts = 0;
    await expect(
      withRetry(
        async () => {
          attempts++;
          throw new HttpResponseError('unavailable', 503);
        },
        { ...options, maxRetries: 0 },
        logger,
        'image',
      ),
    ).rejects.toThrow('unavailable');
    expect(attempts).toBe(1);
  });
  it('does not retry or wait after parent cancellation', async () => {
    const parent = new AbortController();
    let attempts = 0;
    const result = withRetry(
      async () => {
        attempts++;
        throw new HttpResponseError('unavailable', 503);
      },
      options,
      logger,
      'image',
      parent.signal,
    );
    const failureResult = result.catch(error => error);
    await jest.advanceTimersByTimeAsync(0);
    parent.abort();
    expect(await failureResult).toHaveProperty('name', 'AbortError');
    expect(attempts).toBe(1);
    expect(jest.getTimerCount()).toBe(0);
  });
  it('clamps long exponential backoff instead of overflowing the Node timer', async () => {
    const parent = new AbortController();
    let attempts = 0;
    const result = withRetry(
      async () => {
        attempts++;
        throw new HttpResponseError('unavailable', 503);
      },
      { maxRetries: 2, retryBaseDelayMs: 2147483647 },
      logger,
      'image',
      parent.signal,
    );
    const failureResult = result.catch(error => error);
    await jest.advanceTimersByTimeAsync(2147483647);
    expect(attempts).toBe(2);
    await jest.advanceTimersByTimeAsync(1);
    expect(attempts).toBe(2);
    parent.abort();
    expect(await failureResult).toHaveProperty('name', 'AbortError');
  });
});
