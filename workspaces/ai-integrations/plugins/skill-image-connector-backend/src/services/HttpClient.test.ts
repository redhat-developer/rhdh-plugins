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

import { readResponseJson, withRequestTimeout } from './HttpClient';

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(AbortSignal, 'timeout').mockImplementation(ms => {
    const controller = new AbortController();
    setTimeout(
      () =>
        controller.abort(new DOMException('deadline expired', 'TimeoutError')),
      ms,
    );
    return controller.signal;
  });
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('request deadlines and bounded reads', () => {
  it('ends the deadline even while redirect DNS resolution has not settled', async () => {
    const result = withRequestTimeout(
      () => new Promise(() => {}),
      undefined,
      25,
    );
    let settled = false;
    const failureResult = result.catch(error => error);
    void result.catch(() => {
      settled = true;
    });
    await jest.advanceTimersByTimeAsync(25);
    expect(settled).toBe(true);
    expect(await failureResult).toHaveProperty('name', 'TimeoutError');
  });

  it('enforces the configured deadline while reading a body after headers arrive', async () => {
    const result = withRequestTimeout(
      async signal => {
        const response = new Response(
          new ReadableStream({
            start(controller) {
              signal.addEventListener(
                'abort',
                () =>
                  controller.error(
                    new DOMException('body aborted', 'AbortError'),
                  ),
                { once: true },
              );
              controller.enqueue(new TextEncoder().encode('{'));
            },
          }),
        );
        return readResponseJson(response, 100);
      },
      undefined,
      25,
    );
    const failureResult = result.catch(error => error);
    let settled = false;
    void result.catch(() => {
      settled = true;
    });
    await jest.advanceTimersByTimeAsync(24);
    expect(settled).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    expect(await failureResult).toHaveProperty('name', 'TimeoutError');
  });
  it('preserves parent cancellation instead of classifying it as a timeout', async () => {
    const parent = new AbortController();
    const reason = new Error('shutting down');
    const result = withRequestTimeout(
      signal =>
        new Promise((_resolve, reject) => {
          signal.addEventListener(
            'abort',
            () => reject(new DOMException('body aborted', 'AbortError')),
            { once: true },
          );
        }),
      parent.signal,
      25,
    );
    const failureResult = result.catch(error => error);
    parent.abort(reason);
    expect(await failureResult).toBe(reason);
  });
  it('does not start a request after parent cancellation', async () => {
    const operation = jest.fn();
    await expect(
      withRequestTimeout(operation, AbortSignal.abort(), 25),
    ).rejects.toHaveProperty('name', 'AbortError');
    expect(operation).not.toHaveBeenCalled();
  });
  it('cancels an oversized stream without a Content-Length header', async () => {
    const cancel = jest.fn();
    const response = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('123'));
          controller.enqueue(new TextEncoder().encode('456'));
        },
        cancel,
      }),
    );
    await expect(readResponseJson(response, 5)).rejects.toThrow(
      'maximum allowed size',
    );
    expect(cancel).toHaveBeenCalledTimes(1);
  });
  it('rejects an oversized Content-Length before consuming the body', async () => {
    const response = new Response('{}', {
      headers: { 'content-length': '10' },
    });
    const cancel = jest.spyOn(response.body!, 'cancel');
    await expect(readResponseJson(response, 5)).rejects.toThrow(
      'maximum allowed size',
    );
    expect(cancel).toHaveBeenCalledTimes(1);
  });
  it('preserves the size failure if cancelling an oversized stream fails', async () => {
    const response = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('oversized'));
        },
        cancel() {
          throw Object.assign(new Error('connection reset'), {
            code: 'ECONNRESET',
          });
        },
      }),
    );
    await expect(readResponseJson(response, 5)).rejects.toThrow(
      'maximum allowed size',
    );
  });

  it('accepts a response exactly at its limit', async () => {
    await expect(readResponseJson(new Response('{"x":1}'), 7)).resolves.toEqual(
      { x: 1 },
    );
  });
});
