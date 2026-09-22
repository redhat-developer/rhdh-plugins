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

import { fetchWithRetry } from './retry';

const responseWithStatus = (status: number): Response =>
  new Response(null, { status });

describe('fetchWithRetry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('retries matching status codes with exponential backoff', async () => {
    const fetchFn = jest
      .fn<Promise<Response>, []>()
      .mockResolvedValueOnce(responseWithStatus(503))
      .mockResolvedValueOnce(responseWithStatus(503))
      .mockResolvedValue(responseWithStatus(200));

    const result = fetchWithRetry(fetchFn, {
      maxAttempts: 2,
      delayMs: 1500,
      backoff: 2,
      statusCodes: [503],
    });

    await jest.advanceTimersByTimeAsync(0);
    expect(fetchFn).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1499);
    expect(fetchFn).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);
    expect(fetchFn).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(2999);
    expect(fetchFn).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toMatchObject({ ok: true, status: 200 });
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it('stops after maxAttempts retries', async () => {
    const fetchFn = jest
      .fn<Promise<Response>, []>()
      .mockResolvedValue(responseWithStatus(503));

    const result = fetchWithRetry(fetchFn, {
      maxAttempts: 2,
      delayMs: 100,
      statusCodes: [503],
    });

    await jest.advanceTimersByTimeAsync(0);
    await jest.advanceTimersByTimeAsync(300);

    await expect(result).resolves.toMatchObject({ ok: false, status: 503 });
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it('returns immediately for a status code excluded from retries', async () => {
    const fetchFn = jest
      .fn<Promise<Response>, []>()
      .mockResolvedValue(responseWithStatus(404));

    const result = await fetchWithRetry(fetchFn, {
      maxAttempts: 3,
      delayMs: 100,
      statusCodes: [503],
    });

    expect(result).toMatchObject({ ok: false, status: 404 });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('does not retry when maxAttempts is absent', async () => {
    const fetchFn = jest
      .fn<Promise<Response>, []>()
      .mockResolvedValue(responseWithStatus(503));

    const result = await fetchWithRetry(fetchFn, {
      delayMs: 100,
      statusCodes: [503],
    });

    expect(result).toMatchObject({ ok: false, status: 503 });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });
});
