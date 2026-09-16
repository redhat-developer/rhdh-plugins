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

import { VectorStoresOperator } from './VectorStoresOperator';

/**
 * These tests exercise the 429 retry behaviour of {@link VectorStoresOperator}
 * through its public `vectorStores.files.create` method (POST attach), which is
 * one of the two call sites wrapped in `fetchWithRetry`. `global.fetch` is
 * mocked so each attempt's status is scripted, and fake timers skip the real
 * backoff sleeps.
 */
describe('VectorStoresOperator 429 retry', () => {
  const baseURL = 'http://lcs.test';
  const logger = mockServices.logger.mock();

  let fetchMock: jest.Mock;
  let operator: VectorStoresOperator;

  const jsonOk = (body: unknown) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

  const tooManyRequests = (headers?: Record<string, string>) =>
    new Response(JSON.stringify({ detail: 'rate limited' }), {
      status: 429,
      headers: { 'content-type': 'application/json', ...headers },
    });

  const attach = () =>
    operator.vectorStores.files.create('vs-1', { file_id: 'file-1' });

  beforeEach(() => {
    jest.useFakeTimers();
    // Make jitter deterministic; the header/exponential branches are asserted
    // via the exact delay in the warn log, so Math.random must be pinned.
    jest.spyOn(Math, 'random').mockReturnValue(0);
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    VectorStoresOperator.resetInstance();
    operator = VectorStoresOperator.getInstance(baseURL, logger);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('returns the first response without retrying when it succeeds', async () => {
    fetchMock.mockResolvedValueOnce(jsonOk({ id: 'file-1' }));

    const result = await attach();

    expect(result).toEqual({ id: 'file-1' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('retries after a 429 and succeeds on the next attempt', async () => {
    fetchMock
      .mockResolvedValueOnce(tooManyRequests())
      .mockResolvedValueOnce(jsonOk({ id: 'file-1' }));

    const promise = attach();
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({ id: 'file-1' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('honors a numeric Retry-After header for the backoff delay', async () => {
    fetchMock
      .mockResolvedValueOnce(tooManyRequests({ 'retry-after': '2' }))
      .mockResolvedValueOnce(jsonOk({ id: 'file-1' }));

    const promise = attach();
    await jest.runAllTimersAsync();
    await promise;

    // Retry-After: 2 seconds -> 2000ms, taking precedence over exponential.
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('retrying in 2000ms'),
    );
  });

  it('falls back to exponential backoff when no Retry-After is present', async () => {
    fetchMock
      .mockResolvedValueOnce(tooManyRequests())
      .mockResolvedValueOnce(jsonOk({ id: 'file-1' }));

    const promise = attach();
    await jest.runAllTimersAsync();
    await promise;

    // First retry: 2 ** 1 * 250 + random(0)*250 = 500ms.
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('retrying in 500ms'),
    );
  });

  it('applies jitter to the exponential backoff', async () => {
    (Math.random as jest.Mock).mockReturnValue(1);
    fetchMock
      .mockResolvedValueOnce(tooManyRequests())
      .mockResolvedValueOnce(jsonOk({ id: 'file-1' }));

    const promise = attach();
    await jest.runAllTimersAsync();
    await promise;

    // 2 ** 1 * 250 + random(1)*250 = 750ms; jitter shifts the base 500ms.
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('retrying in 750ms'),
    );
  });

  it('caps the exponential backoff at 5000ms', async () => {
    // 8 x 429 then success: attempt 5+ would exceed the cap without Math.min.
    for (let i = 0; i < 8; i++) {
      fetchMock.mockResolvedValueOnce(tooManyRequests());
    }
    fetchMock.mockResolvedValueOnce(jsonOk({ id: 'file-1' }));

    const promise = attach();
    await jest.runAllTimersAsync();
    await promise;

    // 2 ** 5 * 250 = 8000 -> capped to 5000.
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('retrying in 5000ms (attempt 5/8)'),
    );
  });

  it('cancels the 429 response body before retrying to free the socket', async () => {
    const rejected = tooManyRequests();
    const cancelSpy = jest.spyOn(rejected.body!, 'cancel');
    fetchMock
      .mockResolvedValueOnce(rejected)
      .mockResolvedValueOnce(jsonOk({ id: 'file-1' }));

    const promise = attach();
    await jest.runAllTimersAsync();
    await promise;

    expect(cancelSpy).toHaveBeenCalledTimes(1);
  });

  it('gives up after maxRetries and surfaces the final 429', async () => {
    // Default maxRetries is 8, so 1 initial attempt + 8 retries = 9 fetches.
    for (let i = 0; i < 9; i++) {
      fetchMock.mockResolvedValueOnce(tooManyRequests());
    }

    const promise = attach();
    // Attach a rejection handler up front so the eventual throw isn't unhandled.
    const settled = promise.catch(err => err);
    await jest.runAllTimersAsync();
    const error = await settled;

    expect(error).toBeInstanceOf(Error);
    expect(fetchMock).toHaveBeenCalledTimes(9);
    expect(logger.warn).toHaveBeenCalledTimes(8);
  });

  it('does not retry a non-429 error response', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: 'boom' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await expect(attach()).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
