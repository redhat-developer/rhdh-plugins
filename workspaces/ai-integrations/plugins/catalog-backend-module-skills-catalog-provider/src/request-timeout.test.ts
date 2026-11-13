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

import { withRequestTimeout } from './request-timeout';

describe('provider request deadlines', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  it('bounds a client that never settles and aborts its signal', async () => {
    let signal: AbortSignal | undefined;
    const promise = withRequestTimeout(
      async current => {
        signal = current;
        return new Promise<void>(() => {});
      },
      undefined,
      10,
    );
    const rejected = promise.catch(error => error);
    await Promise.resolve();
    jest.advanceTimersByTime(10);
    expect(await rejected).toEqual(new Error('Provider request timed out'));
    expect(signal?.aborted).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });
  it('honors scheduler cancellation', async () => {
    const parent = new AbortController();
    const promise = withRequestTimeout(
      async () => new Promise<void>(() => {}),
      parent.signal,
    );
    const rejected = promise.catch(error => error);
    parent.abort(new Error('cancelled'));
    expect(await rejected).toEqual(new Error('cancelled'));
    expect(jest.getTimerCount()).toBe(0);
  });
  it('does not start requests when already cancelled', async () => {
    const parent = new AbortController();
    parent.abort(new Error('cancelled'));
    const operation = jest.fn();
    await expect(withRequestTimeout(operation, parent.signal)).rejects.toThrow(
      'cancelled',
    );
    expect(operation).not.toHaveBeenCalled();
  });
  it('cleans up its deadline after success', async () => {
    await expect(withRequestTimeout(async () => 'ok')).resolves.toBe('ok');
    expect(jest.getTimerCount()).toBe(0);
  });
});
