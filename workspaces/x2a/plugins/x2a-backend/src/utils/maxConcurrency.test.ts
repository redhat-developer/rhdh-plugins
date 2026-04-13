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
 * See the License for the specific language governing permissions and limitations under the License.
 */

import { maxConcurrency } from './maxConcurrency';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('maxConcurrency', () => {
  it('returns results in the original order', async () => {
    const tasks = [3, 1, 2].map(v => () => Promise.resolve(v));
    const results = await maxConcurrency(tasks, 2);
    expect(results).toEqual([3, 1, 2]);
  });

  it('handles an empty task list', async () => {
    const results = await maxConcurrency([], 5);
    expect(results).toEqual([]);
  });

  it('handles a single task', async () => {
    const results = await maxConcurrency([() => Promise.resolve('only')], 3);
    expect(results).toEqual(['only']);
  });

  it('works when limit equals the number of tasks', async () => {
    const tasks = [1, 2, 3].map(v => () => Promise.resolve(v));
    const results = await maxConcurrency(tasks, 3);
    expect(results).toEqual([1, 2, 3]);
  });

  it('works when limit exceeds the number of tasks', async () => {
    const tasks = [1, 2].map(v => () => Promise.resolve(v));
    const results = await maxConcurrency(tasks, 100);
    expect(results).toEqual([1, 2]);
  });

  it('works with limit of 1 (sequential execution)', async () => {
    const order: number[] = [];
    const tasks = [1, 2, 3].map(v => async () => {
      order.push(v);
      return v * 10;
    });
    const results = await maxConcurrency(tasks, 1);
    expect(results).toEqual([10, 20, 30]);
    expect(order).toEqual([1, 2, 3]);
  });

  it('respects the concurrency limit', async () => {
    let running = 0;
    let maxRunning = 0;
    const limit = 3;

    const tasks = Array.from({ length: 10 }, (_, i) => async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await delay(10);
      running--;
      return i;
    });

    const results = await maxConcurrency(tasks, limit);

    expect(maxRunning).toBeLessThanOrEqual(limit);
    expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('does not leave slots idle when one task is slow (pool behaviour)', async () => {
    const completionOrder: number[] = [];
    const limit = 2;

    const tasks = [
      async () => {
        await delay(100);
        completionOrder.push(0);
        return 'slow';
      },
      async () => {
        await delay(10);
        completionOrder.push(1);
        return 'fast-1';
      },
      async () => {
        await delay(10);
        completionOrder.push(2);
        return 'fast-2';
      },
      async () => {
        await delay(10);
        completionOrder.push(3);
        return 'fast-3';
      },
    ];

    const results = await maxConcurrency(tasks, limit);

    // fast tasks (1,2,3) should all complete before the slow task (0)
    expect(completionOrder.indexOf(0)).toBeGreaterThan(
      completionOrder.indexOf(1),
    );
    expect(completionOrder.indexOf(0)).toBeGreaterThan(
      completionOrder.indexOf(2),
    );
    // Results must still be in original order
    expect(results).toEqual(['slow', 'fast-1', 'fast-2', 'fast-3']);
  });

  it('propagates the first rejection and rejects the returned promise', async () => {
    const tasks = [
      () => Promise.resolve('ok'),
      () => Promise.reject(new Error('boom')),
      () => Promise.resolve('never'),
    ];

    await expect(maxConcurrency(tasks, 2)).rejects.toThrow('boom');
  });

  it('invokes each task factory exactly once', async () => {
    const factory = jest.fn(() => Promise.resolve(42));
    const tasks = Array.from({ length: 5 }, () => factory);
    await maxConcurrency(tasks, 2);
    expect(factory).toHaveBeenCalledTimes(5);
  });

  it('handles tasks that return different types', async () => {
    const tasks: (() => Promise<string | number | boolean>)[] = [
      () => Promise.resolve('a'),
      () => Promise.resolve(2),
      () => Promise.resolve(true),
    ];
    const results = await maxConcurrency(tasks, 2);
    expect(results).toEqual(['a', 2, true]);
  });

  it('handles tasks that resolve to undefined', async () => {
    const tasks = Array.from(
      { length: 3 },
      () => () => Promise.resolve(undefined),
    );
    const results = await maxConcurrency(tasks, 2);
    expect(results).toEqual([undefined, undefined, undefined]);
  });
});
