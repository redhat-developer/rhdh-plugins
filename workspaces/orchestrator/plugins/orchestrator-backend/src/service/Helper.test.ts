/*
 * Copyright 2024 The Backstage Authors
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
import { retryAsyncFunction } from './Helper';

describe('retryAsyncFunction', () => {
  const successfulResponse = 'Success';
  it('should be successful in the first attempt', async () => {
    const asyncFnSuccess = jest.fn().mockResolvedValueOnce(successfulResponse);

    const result = await retryAsyncFunction({
      asyncFn: asyncFnSuccess,
      maxAttempts: 3,
      delayMs: 100,
    });

    expect(result).toBe(successfulResponse);
    expect(asyncFnSuccess).toHaveBeenCalledTimes(1);
  });

  it('should throw an error after maximum attempts', async () => {
    const asyncFnFailure = jest.fn().mockResolvedValue(undefined);

    await expect(
      retryAsyncFunction({
        asyncFn: asyncFnFailure,
        maxAttempts: 5,
        delayMs: 100,
      }),
    ).rejects.toThrow();

    expect(asyncFnFailure).toHaveBeenCalledTimes(5);
  });

  it('should retry until successful after getting some undefined responses', async () => {
    const asyncFns = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(successfulResponse);

    const result = await retryAsyncFunction({
      asyncFn: asyncFns,
      maxAttempts: 5,
      delayMs: 100,
    });

    expect(result).toBe(successfulResponse);
    expect(asyncFns).toHaveBeenCalledTimes(4);
  });
});
